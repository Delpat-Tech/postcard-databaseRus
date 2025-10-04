import { useOrderStore, type Recipient } from "../store/orderStore";
import { Button } from "./FormComponents";

export default function RecipientList() {
  const { currentOrder, removeRecipient } = useOrderStore();

  const recipients = currentOrder.recipients || [];

  if (recipients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recipients added yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Recipients ({recipients.length})
      </h3>
      <div className="space-y-3">
        {recipients.map((recipient: Recipient) => (
          <div
            key={recipient.id}
            className="bg-white border rounded-lg p-4 flex justify-between items-start"
          >
            <div className="flex-1">
              <div className="font-medium">
                {recipient.firstName} {recipient.lastName}
                {recipient.company && (
                  <span className="text-gray-500 ml-2">
                    ({recipient.company})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {recipient.address1}
                {recipient.address2 && <span>, {recipient.address2}</span>}
              </div>
              <div className="text-sm text-gray-600">
                {recipient.city}, {recipient.state} {recipient.zipCode}
              </div>
              {recipient.externalReferenceNumber && (
                <div className="text-sm text-gray-500">
                  Ref: {recipient.externalReferenceNumber}
                </div>
              )}
            </div>
            <Button
              variant="danger"
              onClick={() => removeRecipient(recipient.id)}
              className="ml-4"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
