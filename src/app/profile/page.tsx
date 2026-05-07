export default function PortalProfilePage() {
  return (
    <div>
      <h1 className="section-title">Profile</h1>
      <p className="section-subtitle">Manage your account</p>

      <div className="card mt-6 max-w-2xl">
        <div className="card-body space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" className="input" placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" className="input" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input" disabled placeholder="john@example.com" />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="btn btn-primary">Save Changes</button>
            <button className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
