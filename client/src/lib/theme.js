export const THEME = {
  statusColors: {
    active: "green",
    won: "green",
    completed: "green",
    paid: "green",

    inactive: "red",
    lost: "red",
    cancelled: "red",
    void: "red",

    in_progress: "blue",
    contacted: "blue",
    sent: "blue",

    on_hold: "amber",
    pending: "amber",
    draft: "amber",

    new: "gray",
    todo: "gray",
    lead: "gray",

    overdue: "red",
    critical: "red",
    blocked: "red",

    review: "purple",
    qualified: "purple",
  },
  roleColors: {
    super_admin: "purple",
    admin: "blue",
    manager: "teal",
    developer: "green",
    designer: "pink",
    qa_engineer: "orange",
    client: "gray",
  },
  priorityColors: {
    critical: "red",
    high: "orange",
    medium: "blue",
    low: "gray",
  },
  sidebar: {
    widthExpanded: "260px",
    widthCollapsed: "72px",
  },
  zIndex: {
    sidebar: 40,
    modal: 50,
    toast: 60,
    tooltip: 70,
  },
}
