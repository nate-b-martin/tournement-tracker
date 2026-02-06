import { useState } from "react";

export const PlayerFilters = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: [],
    teamId: undefined,
  });
};
