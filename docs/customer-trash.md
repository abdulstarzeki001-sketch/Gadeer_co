# Customer recycle bin

Deleting a customer now archives the customer. Documents, document items and
transactions keep their original IDs, amounts and foreign keys. Restoring the
customer therefore restores the complete account without copying money rows.

## Storage and deployment

No database migration is required. `traders.notes` temporarily stores the reserved
`GHADEER-CUSTOMER-TRASH-V1:` prefix followed by JSON containing the deletion date
and the exact original notes (including null). Restoration unwraps the original
notes. Do not manually edit this envelope. Archive and restore each perform one
conditional row update; failed permissions or concurrent changes fail safely.

All active customer, transaction and receipt queries use `src/lib/customer-trash.ts`.
The financial queries exclude archived customers on the server before pagination,
including transactions associated through a customer's document. Unassigned
transactions are retained. This is an application visibility rule, not a new RLS
security boundary. Existing database access policies still apply.

Future screens must use these query helpers rather than reading all rows directly.
After deploying, refresh open tabs so they no longer run the old hard-delete code.
There is no permanent-delete action in the recycle bin.

## Access

- Customers → Recycle bin; search by customer name and browse all pages.
- Account statements → Customer recycle bin.
- Each entry offers transaction history and full restoration.

## Verification

Run on Node 22.6 or later:

```sh
node --experimental-strip-types --test tests/customer-trash.test.mjs
npm run build
npx tsc --noEmit
```

Tests cover lossless notes restoration, repeated requests, denied writes,
concurrent updates, corrupt metadata and server query filters. A signed-in manual
smoke test should archive a test customer with receipts and transactions, confirm
it disappears from reports/collections/receipts, then restore and compare values.

Customers permanently deleted by older releases cannot be reconstructed by this
feature: those releases detached their financial rows and removed the customer.
Recovering such records requires an earlier database backup.
