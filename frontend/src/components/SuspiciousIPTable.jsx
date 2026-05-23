import React from 'react';

export default function SuspiciousIPTable({ events }) {
  // Aggregate events by IP
  const ips = {};
  events.forEach(e => {
    if (!ips[e.src_ip]) ips[e.src_ip] = { ip: e.src_ip, events: 0, high: 0 };
    ips[e.src_ip].events += 1;
    if (e.severity === 'high' || e.severity === 'critical') ips[e.src_ip].high += 1;
  });

  const sortedIps = Object.values(ips).sort((a, b) => b.high - a.high || b.events - a.events).slice(0, 5);

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4">Top Suspicious IPs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="pb-3 font-medium">IP Address</th>
              <th className="pb-3 font-medium">Events</th>
              <th className="pb-3 font-medium">Critical/High</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedIps.length > 0 ? sortedIps.map((ip, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-3 font-mono">{ip.ip}</td>
                <td className="py-3">{ip.events}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${ip.high > 0 ? 'bg-danger/20 text-danger font-bold' : 'bg-gray-800'}`}>
                    {ip.high}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="3" className="py-4 text-center text-gray-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
