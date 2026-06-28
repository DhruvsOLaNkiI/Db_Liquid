import { Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Header } from '../components/Header';
import { getAllUsers } from '../utils/users';

export function UsersPage() {
  const users = getAllUsers();
  const buyers = users.filter((u) => u.roles.includes('buyer'));
  const sellers = users.filter((u) => u.roles.includes('seller'));

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/prototype"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Prototype
          </Link>

          <h1 className="text-3xl font-bold tracking-tight mb-2">Registered users</h1>
          <p className="text-gray-600 mb-8">
            Buyer and seller access on one account — stored in <strong>MongoDB</strong>.
          </p>

          {users.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <User size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-6">No users yet. Create an account to see it here.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <UserTable title={`Buyers (${buyers.length})`} users={buyers} emptyMessage="No buyer accounts yet." />
              <UserTable title={`Sellers (${sellers.length})`} users={sellers} emptyMessage="No seller accounts yet." />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UserTable({
  title,
  users,
  emptyMessage,
}: {
  title: string;
  users: ReturnType<typeof getAllUsers>;
  emptyMessage: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-lg">{title}</h2>
      </div>
      {users.length === 0 ? (
        <p className="px-6 py-8 text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">User ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Roles</th>
                <th className="px-6 py-3 font-medium">Credits</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono break-all">
                      {user.id}
                    </code>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            role === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.roles.includes('buyer') ? (user.credits ?? 0) : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
