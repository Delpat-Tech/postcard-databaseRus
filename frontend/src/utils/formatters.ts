export const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800",
        pending_admin_approval: "bg-yellow-100 text-yellow-800",
        submitted_to_pcm: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
};

export const formatDate = (value: any) => {
    if (!value) return "Not set";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString();
};
