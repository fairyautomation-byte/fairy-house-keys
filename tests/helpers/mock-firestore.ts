/**
 * In-memory mock Firestore implementation for fast, reliable unit & integration tests
 * without requiring Java JRE or a remote Firebase instance.
 */

export class MockDocumentReference {
  constructor(
    public readonly collectionName: string,
    public readonly id: string,
    private readonly store: MockFirestoreStore,
  ) {}

  async get() {
    const data = this.store.get(this.collectionName, this.id);
    return new MockDocumentSnapshot(this.id, data, this);
  }

  async set(data: any, options?: { merge?: boolean }) {
    this.store.set(this.collectionName, this.id, data, options?.merge);
  }

  async update(data: any) {
    this.store.update(this.collectionName, this.id, data);
  }

  async delete() {
    this.store.delete(this.collectionName, this.id);
  }
}

export class MockDocumentSnapshot {
  constructor(
    public readonly id: string,
    private readonly _data: any | undefined,
    public readonly ref: MockDocumentReference,
  ) {}

  get exists() {
    return this._data !== undefined;
  }

  data() {
    if (!this._data) return undefined;
    // Return deep clone to prevent direct mutations
    return JSON.parse(JSON.stringify(this._data));
  }
}

export class MockQuery {
  constructor(
    protected readonly collectionName: string,
    protected readonly store: MockFirestoreStore,
    protected readonly filters: Array<{ field: string; op: string; val: any }> = [],
    protected readonly limitCount?: number,
    protected readonly order?: { field: string; direction: "asc" | "desc" },
    protected readonly afterId?: string,
  ) {}

  where(field: string, op: string, val: any) {
    return new MockQuery(
      this.collectionName,
      this.store,
      [...this.filters, { field, op, val }],
      this.limitCount,
      this.order,
      this.afterId,
    );
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new MockQuery(
      this.collectionName,
      this.store,
      this.filters,
      this.limitCount,
      { field, direction },
      this.afterId,
    );
  }

  startAfter(docOrId: any) {
    const afterId = typeof docOrId === "string" ? docOrId : docOrId?.id;
    return new MockQuery(
      this.collectionName,
      this.store,
      this.filters,
      this.limitCount,
      this.order,
      afterId,
    );
  }

  limit(count: number) {
    return new MockQuery(
      this.collectionName,
      this.store,
      this.filters,
      count,
      this.order,
      this.afterId,
    );
  }

  count() {
    return {
      get: async () => {
        let docs = this.store.getAll(this.collectionName);
        for (const f of this.filters) {
          docs = docs.filter((d) => {
            const docVal = d.data[f.field];
            if (f.op === "==") return docVal === f.val;
            if (f.op === "in") return Array.isArray(f.val) && f.val.includes(docVal);
            return true;
          });
        }
        return {
          data: () => ({ count: docs.length }),
        };
      },
    };
  }

  async get() {
    let docs = this.store.getAll(this.collectionName);
    for (const f of this.filters) {
      docs = docs.filter((d) => {
        const docVal = d.data[f.field];
        if (f.op === "==") return docVal === f.val;
        if (f.op === "in") return Array.isArray(f.val) && f.val.includes(docVal);
        return true;
      });
    }
    if (this.order) {
      docs.sort((a, b) => {
        const valA = a.data[this.order!.field];
        const valB = b.data[this.order!.field];
        const tA = valA?.getTime ? valA.getTime() : valA;
        const tB = valB?.getTime ? valB.getTime() : valB;
        if (tA < tB) return this.order!.direction === "asc" ? -1 : 1;
        if (tA > tB) return this.order!.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    if (this.afterId) {
      const idx = docs.findIndex((d) => d.id === this.afterId);
      if (idx !== -1) {
        docs = docs.slice(idx + 1);
      }
    }
    if (this.limitCount !== undefined) {
      docs = docs.slice(0, this.limitCount);
    }
    const snapshots = docs.map(
      (d) =>
        new MockDocumentSnapshot(
          d.id,
          d.data,
          new MockDocumentReference(this.collectionName, d.id, this.store),
        ),
    );
    return {
      docs: snapshots,
      size: snapshots.length,
      empty: snapshots.length === 0,
      forEach: (fn: (doc: any) => void) => snapshots.forEach(fn),
    };
  }
}

export class MockCollectionReference extends MockQuery {
  constructor(
    public readonly name: string,
    private readonly colStore: MockFirestoreStore,
  ) {
    super(name, colStore);
  }

  doc(id: string) {
    return new MockDocumentReference(this.name, id, this.colStore);
  }

  async add(data: any) {
    const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.colStore.set(this.name, id, data);
    return new MockDocumentReference(this.name, id, this.colStore);
  }
}

class MockFirestoreStore {
  public collections = new Map<string, Map<string, any>>();

  get(col: string, id: string) {
    return this.collections.get(col)?.get(id);
  }

  getAll(col: string) {
    const m = this.collections.get(col);
    if (!m) return [];
    return Array.from(m.entries()).map(([id, data]) => ({ id, data }));
  }

  set(col: string, id: string, data: any, merge = false) {
    if (!this.collections.has(col)) {
      this.collections.set(col, new Map());
    }
    const colMap = this.collections.get(col)!;
    if (merge && colMap.has(id)) {
      colMap.set(id, { ...colMap.get(id), ...JSON.parse(JSON.stringify(data)) });
    } else {
      colMap.set(id, JSON.parse(JSON.stringify(data)));
    }
  }

  update(col: string, id: string, data: any) {
    const colMap = this.collections.get(col);
    if (!colMap || !colMap.has(id)) {
      throw new Error(`Document ${col}/${id} not found for update`);
    }
    colMap.set(id, { ...colMap.get(id), ...JSON.parse(JSON.stringify(data)) });
  }

  delete(col: string, id: string) {
    this.collections.get(col)?.delete(id);
  }

  clear() {
    this.collections.clear();
  }
}

export class MockTransaction {
  private reads = new Map<string, any>();
  private writes: Array<() => void> = [];

  constructor(private readonly store: MockFirestoreStore) {}

  async get(ref: MockDocumentReference) {
    const snap = await ref.get();
    this.reads.set(`${ref.collectionName}/${ref.id}`, snap.data());
    return snap;
  }

  set(ref: MockDocumentReference, data: any, options?: { merge?: boolean }) {
    this.writes.push(() =>
      this.store.set(ref.collectionName, ref.id, data, options?.merge),
    );
  }

  update(ref: MockDocumentReference, data: any) {
    this.writes.push(() =>
      this.store.update(ref.collectionName, ref.id, data),
    );
  }

  delete(ref: MockDocumentReference) {
    this.writes.push(() =>
      this.store.delete(ref.collectionName, ref.id),
    );
  }

  commit() {
    for (const write of this.writes) write();
  }
}

export class MockFirestore {
  private readonly store = new MockFirestoreStore();

  collection(name: string) {
    return new MockCollectionReference(name, this.store);
  }

  async runTransaction<T>(
    updateFunction: (tx: MockTransaction) => Promise<T>,
    _options?: { maxAttempts?: number },
  ): Promise<T> {
    const tx = new MockTransaction(this.store);
    const result = await updateFunction(tx);
    tx.commit();
    return result;
  }

  seed(col: string, id: string, data: any) {
    this.store.set(col, id, data);
  }

  clear() {
    this.store.clear();
  }
}
