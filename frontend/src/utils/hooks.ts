import { useEffect, useState } from "react";

export function useSortedOrders(orders: any[], sortOption: string) {
    const [sortedOrders, setSortedOrders] = useState(orders);

    useEffect(() => {
        const sorted = [...orders].sort((a, b) => {
            switch (sortOption) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "pending":
                    return a.status === "pending_admin_approval" ? -1 : 1;
                case "approved":
                    return a.status === "approved" ? -1 : 1;
                case "rejected":
                    return a.status === "rejected" ? -1 : 1;
                default:
                    return 0;
            }
        });
        setSortedOrders(sorted);
    }, [orders, sortOption]);

    return sortedOrders;
}
