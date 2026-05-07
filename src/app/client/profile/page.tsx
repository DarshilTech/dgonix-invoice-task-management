export default function ClientProfilePage() {
  return (
    <div>
      <h1 className="section-title">Profile</h1>
      <p className="section-subtitle">Manage your client portal account</p>

      <div className="card mt-6 max-w-2xl">
        <div className="card-body space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Client user" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" disabled placeholder="client@example.com" />
          </div>
          <button className="btn btn-primary" type="button">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
