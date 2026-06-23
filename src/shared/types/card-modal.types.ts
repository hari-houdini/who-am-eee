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
};

export type { CardOpenDetail };
