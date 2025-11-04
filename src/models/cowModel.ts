export class Cow {
  id: number;
  name: string;

  constructor(data: Partial<Cow>) {
    this.id = Date.now();
    this.name = data.name ?? 'Cow';
  }

  get displayName(): string {
    return `${this.name}`;
  }
}
