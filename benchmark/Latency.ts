export class Latency {
	constructor(private readonly milliseconds: number) {}

	async pass(): Promise<void> {
		if (this.milliseconds > 0) await Bun.sleep(this.milliseconds);
	}
}
