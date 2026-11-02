import { WebAddress } from "../../domain/source/WebAddress.ts";
import { Arrival } from "./Arrival.ts";

const MOST_REDIRECTS = 3;
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

export class RedirectFollower {
	async arriveAt(
		address: WebAddress,
		signal: AbortSignal,
	): Promise<Arrival | null> {
		let current = address;
		let arrival: Arrival | null = null;
		let isFollowing = true;
		for (let hops = 0; isFollowing && hops <= MOST_REDIRECTS; hops++) {
			const response = await this.fetchPage(current, signal);
			const next = this.redirectTarget(response, current);
			isFollowing = next.isValid();
			if (isFollowing) {
				await response.body?.cancel();
				current = next;
			} else {
				arrival = await this.arrivalFrom(response, current);
			}
		}
		return arrival;
	}

	private fetchPage(
		address: WebAddress,
		signal: AbortSignal,
	): Promise<Response> {
		return fetch(address.toString(), { redirect: "manual", signal });
	}

	private redirectTarget(response: Response, from: WebAddress): WebAddress {
		const isRedirect = REDIRECT_STATUSES.includes(response.status);
		const location = response.headers.get("location") ?? "";
		let target = new WebAddress("");
		if (isRedirect) target = from.resolve(location);
		return target;
	}

	private async arrivalFrom(
		response: Response,
		address: WebAddress,
	): Promise<Arrival | null> {
		let arrival: Arrival | null = null;
		if (response.ok) {
			arrival = new Arrival(response, address);
		} else {
			await response.body?.cancel();
		}
		return arrival;
	}
}
