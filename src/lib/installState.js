import fsOperation from "fileSystem";
import Url from "utils/Url";

const INSTALL_STATE_STORAGE = Url.join(DATA_STORAGE, ".install-state");

export default class InstallState {
	/** @type Record<string, string> */
	store;
	/** @type Record<string, string> */
	updatedStore;

	/**
	 *
	 * @param {string} id
	 * @returns
	 */
	static async new(id) {
		const state = new InstallState();
		state.id = await checksumText(id);
		state.updatedStore = {};

		if (!(await fsOperation(INSTALL_STATE_STORAGE).exists())) {
			await fsOperation(DATA_STORAGE).createDirectory(".install-state");
		}

		state.storeUrl = Url.join(INSTALL_STATE_STORAGE, state.id);
		if (await fsOperation(state.storeUrl).exists()) {
			state.store = JSON.parse(
				await fsOperation(state.storeUrl).readFile("utf-8"),
			);
		} else {
			state.store = {};
			await fsOperation(INSTALL_STATE_STORAGE).createFile(state.id);
		}

		return state;
	}

	/**
	 *
	 * @param {string} url
	 * @param {ArrayBuffer | string} content
	 * @param {boolean} isString
	 * @returns
	 */
	async isUpdated(url, content) {
		const current = this.store[url];
		const update =
			typeof content === "string"
				? await checksumText(content)
				: await checksum(content);
		this.updatedStore[url] = update;

		if (current === update) {
			return false;
		} else {
			return true;
		}
	}

	exists(url) {
		if (typeof this.store[url] !== "undefined") {
			return true;
		} else {
			return false;
		}
	}

	async save() {
		this.store = this.updatedStore;
		await fsOperation(this.storeUrl).writeFile(
			JSON.stringify(this.updatedStore),
		);
	}
}

/**
 * Derives the checksum of a Buffer
 * @param {BufferSource} data
 * @returns the derived checksum
 */
async function checksum(data) {
	const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

/**
 *
 * @param {string} text
 * @returns
 */
async function checksumText(text) {
	const textUint8 = new TextEncoder().encode(text);
	return await checksum(textUint8);
}
