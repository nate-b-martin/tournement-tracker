import { useState } from "react";

export const PlayerFilters = () => {
	const [_filters, _setFilters] = useState({
		search: "",
		status: [],
		teamId: undefined,
	});
};
