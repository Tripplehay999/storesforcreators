/** Shown only to admins and the store's creator while the store's checkout is in "testing". */
export default function TestingNote({ test }: { test: boolean }) {
  return (
    <div className="sf-testing" role="note">
      <div className="sf-wrap">
        <strong>Checkout is in testing.</strong> Only you and the Stores for Creators team can see the Buy buttons.{" "}
        {test ? (
          <>Pay with the test card <code>4242 4242 4242 4242</code>, any future date and any 3-digit code. No real money moves.</>
        ) : (
          <>Purchases here are real payments.</>
        )}
      </div>
    </div>
  );
}
