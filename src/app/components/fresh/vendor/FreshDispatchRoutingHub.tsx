import React, { useState } from 'react';
import {
  Truck, MapPin, CheckCircle, Clock, AlertTriangle, Snowflake,
  Building, ChevronRight, UserCheck, ShieldCheck, CheckCheck, Camera
} from 'lucide-react';

interface DeliveryItem {
  id: number;
  customerName: string;
  tower: string;
  flatNo: string;
  orderNumber: string;
  productSummary: string;
  handlingClass: 'CHILLED_COLD_CHAIN' | 'AMBIENT' | 'FROZEN';
  status: 'PENDING' | 'DELIVERED' | 'RESCHEDULED';
  deliveredAt?: string;
}

interface DeliveryBatch {
  id: number;
  batchCode: string;
  communityName: string;
  deliveryDate: string;
  assignedRunner: string;
  runnerContact: string;
  status: 'PLANNED' | 'IN_TRANSIT' | 'COMPLETED';
  totalDrops: number;
  completedDrops: number;
  handlingClass: 'CHILLED_COLD_CHAIN' | 'AMBIENT';
  items: DeliveryItem[];
}

const INITIAL_BATCHES: DeliveryBatch[] = [
  {
    id: 1,
    batchCode: 'RUN-20261104-PL01',
    communityName: 'Prestige Lakeside Habitat',
    deliveryDate: '2026-11-04',
    assignedRunner: 'Ramesh Verma',
    runnerContact: '+91 98765 43210',
    status: 'IN_TRANSIT',
    totalDrops: 4,
    completedDrops: 2,
    handlingClass: 'CHILLED_COLD_CHAIN',
    items: [
      {
        id: 101,
        customerName: 'Ananya Sharma',
        tower: 'Tower 4',
        flatNo: '802',
        orderNumber: 'ORD-9821',
        productSummary: 'Fresh Cut Papaya (250g) x 2, Idli Batter (1L)',
        handlingClass: 'CHILLED_COLD_CHAIN',
        status: 'DELIVERED',
        deliveredAt: '06:45 AM'
      },
      {
        id: 102,
        customerName: 'Vikram Joshi',
        tower: 'Tower 4',
        flatNo: '1105',
        orderNumber: 'ORD-9825',
        productSummary: 'High Protein Athlete Bowl x 1',
        handlingClass: 'CHILLED_COLD_CHAIN',
        status: 'DELIVERED',
        deliveredAt: '06:52 AM'
      },
      {
        id: 103,
        customerName: 'Kavitha Rao',
        tower: 'Tower 7',
        flatNo: '304',
        orderNumber: 'ORD-9831',
        productSummary: 'Cold Pressed Valencia Orange Juice (500ml)',
        handlingClass: 'CHILLED_COLD_CHAIN',
        status: 'PENDING'
      },
      {
        id: 104,
        customerName: 'Sunil Nair',
        tower: 'Tower 9',
        flatNo: '1401',
        orderNumber: 'ORD-9834',
        productSummary: 'Organic Ragi Dosa Batter (1L)',
        handlingClass: 'CHILLED_COLD_CHAIN',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 2,
    batchCode: 'RUN-20261104-PL02',
    communityName: 'Sobha Dream Acres',
    deliveryDate: '2026-11-04',
    assignedRunner: 'Arjun Das',
    runnerContact: '+91 91234 56789',
    status: 'PLANNED',
    totalDrops: 3,
    completedDrops: 0,
    handlingClass: 'CHILLED_COLD_CHAIN',
    items: [
      {
        id: 201,
        customerName: 'Priya Iyer',
        tower: 'Wing A',
        flatNo: '402',
        orderNumber: 'ORD-9840',
        productSummary: 'Farm Fresh Strawberries (Grade A), Batter (1L)',
        handlingClass: 'CHILLED_COLD_CHAIN',
        status: 'PENDING'
      }
    ]
  }
];

export const FreshDispatchRoutingHub: React.FC = () => {
  const [batches, setBatches] = useState<DeliveryBatch[]>(INITIAL_BATCHES);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(INITIAL_BATCHES[0].id);

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  const handleMarkDelivered = (itemId: number) => {
    setBatches(batches.map(b => {
      if (b.id === selectedBatchId) {
        const updatedItems = b.items.map(it => {
          if (it.id === itemId) {
            return {
              ...it,
              status: 'DELIVERED' as const,
              deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
          return it;
        });
        const completed = updatedItems.filter(i => i.status === 'DELIVERED').length;
        return {
          ...b,
          items: updatedItems,
          completedDrops: completed,
          status: completed === b.totalDrops ? 'COMPLETED' : 'IN_TRANSIT'
        };
      }
      return b;
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mana Fresh Dispatch & Route Logistics</h1>
              <p className="text-sm text-gray-500">Community gate dispatch, cold-chain handover & doorstep sort sequencing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatch Runs List */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Community Runs</h2>
          {batches.map(batch => (
            <div
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedBatchId === batch.id
                  ? 'bg-white border-cyan-500 shadow-md ring-2 ring-cyan-100'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{batch.communityName}</div>
                  <div className="text-xs font-mono text-cyan-600 mt-0.5">{batch.batchCode}</div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  batch.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                  batch.status === 'IN_TRANSIT' ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {batch.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>Runner: {batch.assignedRunner}</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1 font-medium">
                  <span>Drop Progress</span>
                  <span>{batch.completedDrops} / {batch.totalDrops} completed</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all"
                    style={{ width: `${(batch.completedDrops / (batch.totalDrops || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Selected Batch Drop Sequence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedBatch.communityName} Doorstep Manifest</h3>
                <p className="text-xs text-gray-400">Optimized Tower & Flat sequencing for morning delivery run</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-medium rounded-lg">
                  <Snowflake className="w-3.5 h-3.5" /> Chilled Cold Chain
                </div>
              </div>
            </div>

            {/* Stops list */}
            <div className="space-y-3">
              {selectedBatch.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    item.status === 'DELIVERED' ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{item.customerName}</span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {item.tower} - {item.flatNo}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{item.productSummary}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.orderNumber}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {item.status === 'DELIVERED' ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                        <CheckCheck className="w-4 h-4" /> Delivered at {item.deliveredAt}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkDelivered(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreshDispatchRoutingHub;