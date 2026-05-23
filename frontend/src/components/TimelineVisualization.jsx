import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, FileDown, Activity, Terminal } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function TimelineVisualization({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="card h-96 flex items-center justify-center text-gray-500">
        No events found for this PCAP yet.
      </div>
    );
  }

  const getIcon = (type) => {
    switch(type) {
      case 'port_scan': return <Activity className="w-5 h-5" />;
      case 'exploit': return <AlertTriangle className="w-5 h-5" />;
      case 'c2_beacon': return <Terminal className="w-5 h-5" />;
      case 'file_transfer': return <FileDown className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-danger border-danger';
      case 'high': return 'bg-warning border-warning';
      case 'medium': return 'bg-primary border-primary';
      default: return 'bg-gray-600 border-gray-600';
    }
  };
  
  const getFillColor = (severity) => {
    switch(severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#4B5563';
    }
  };

  // Prepare data for Recharts scatter plot
  const chartData = events.map(e => {
    const d = e.timestamp ? new Date(e.timestamp).getTime() : 0;
    return {
      x: d,
      y: e.event_type,
      z: e.severity === 'critical' ? 4 : e.severity === 'high' ? 3 : e.severity === 'medium' ? 2 : 1,
      fill: getFillColor(e.severity),
      event: e
    };
  }).filter(d => d.x !== 0);

  const formatXAxis = (tickItem) => {
    return format(new Date(tickItem), 'HH:mm:ss');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload.event;
      return (
        <div className="bg-surface border border-gray-700 p-3 rounded shadow-xl text-sm max-w-xs">
          <div className="font-bold mb-1" style={{color: payload[0].payload.fill}}>{data.event_type.toUpperCase()}</div>
          <div className="text-gray-300 text-xs mb-1">{format(new Date(data.timestamp), 'yyyy-MM-dd HH:mm:ss')}</div>
          <div className="text-gray-400 text-xs truncate">{data.src_ip} &rarr; {data.dst_ip}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card space-y-6">
      <h3 className="text-xl font-bold">Attack Timeline</h3>
      
      {/* Graphical Visualization */}
      {chartData.length > 0 && (
        <div className="h-48 w-full bg-gray-900/30 rounded-xl p-4 border border-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Time" 
                domain={['auto', 'auto']} 
                tickFormatter={formatXAxis} 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{fill: '#9CA3AF'}}
              />
              <YAxis 
                type="category" 
                dataKey="y" 
                name="Type" 
                stroke="#9CA3AF"
                fontSize={11}
                width={80}
                tick={{fill: '#9CA3AF'}}
              />
              <ZAxis type="number" dataKey="z" range={[50, 200]} />
              <Tooltip cursor={{strokeDasharray: '3 3'}} content={<CustomTooltip />} />
              <Scatter data={chartData} fill="#8884d8">
                {chartData.map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chronological List */}
      <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-gray-700/50 mt-8 pt-4">
        {events.map((event, idx) => (
          <div key={idx} className="relative group">
            <div className={`absolute -left-10 w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${getColor(event.severity)}`}>
              {getIcon(event.event_type)}
            </div>
            <div className="glass-panel p-4 ml-4 transition-all hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`px-2 py-1 text-xs rounded uppercase font-bold mr-2 ${getColor(event.severity).split(' ')[0]} bg-opacity-20`}>
                    {event.severity}
                  </span>
                  <span className="font-semibold text-gray-100">{event.event_type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {event.timestamp ? format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'Unknown'}
                </span>
              </div>
              <p className="text-gray-300 mb-3 text-sm">{event.description}</p>
              <div className="text-xs font-mono text-gray-400 bg-gray-900 p-2.5 rounded border border-gray-800">
                <div className="flex justify-between">
                  <span>SRC: <span className="text-gray-300">{event.src_ip}</span></span>
                  <span>DST: <span className="text-gray-300">{event.dst_ip}</span></span>
                  <span>PROTO: <span className="text-primary">{event.protocol}</span></span>
                </div>
                {event.evidence && (
                  <div className="mt-2 pt-2 border-t border-gray-800 text-gray-500">
                    Evidence: <span className="text-gray-400">{event.evidence}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
