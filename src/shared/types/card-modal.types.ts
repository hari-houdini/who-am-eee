/**
 * Payload carried by the `card:open` custom event detail.
 * Dispatched by `<hyper-card>` and consumed by `<card-modal>`.
 */
type CardOpenDetail = {
	/** Card heading text to display in the modal title. */
	heading: string;
	/**
	 * Value of the `body-tag` attribute on `<hyper-card>`.
	 * Empty string when the card has no custom element body.
	 */
	bodyTag: string;
	/**
	 * Value of the `card-id` attribute on `<hyper-card>` (e.g. `'PROJ.REPOS.001'`).
	 * Forwarded to {@link createCardBodyElement} so self-contained components like
	 * `<project-tabs>` can look up their own data without requiring content injection.
	 */
	cardId: string;
};

export type { CardOpenDetail };
