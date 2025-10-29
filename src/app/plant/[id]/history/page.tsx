// app/plant/[id]/history/page.tsx
"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Define the core data types
interface HCSMessage {
  consensus_timestamp: string;
  message: string; // Base64-encoded JSON
  sequence_number: number;
  topic_id: string;
  running_hash: string;
  chunk_info?: {
    number: number;
    total: number;
  };
}

interface ParsedMessage {
  event: string;
  plant_id: string;
  seal_hash?: string;
  validity_date?: string;
  is_valid?: boolean;
  timestamp: string;
  // Add transaction_id from the actual HCS message data
  transaction_id?: string;
}

// Modal component for showing full hash
function HashModal({ hash, type, onClose }: { hash: string; type: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Full {type}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <code className="text-sm break-all font-mono text-gray-800">{hash}</code>
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
async function fetchTopicMessages(topicId: string, limit: number = 100): Promise<HCSMessage[]> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.messages || [];
}

// Function to get transaction ID from consensus timestamp
function getTransactionIdFromTimestamp(consensusTimestamp: string): string {
  // Convert consensus timestamp to transaction ID format
  // Consensus timestamp format: 1234567890.123456789
  const [seconds, nanos] = consensusTimestamp.split('.');
  return `${seconds}.${nanos.slice(0, 9)}`; // Hedera transaction ID format
}

function parseMessage(msg: HCSMessage): ParsedMessage | null {
  try {
    const decoded = Buffer.from(msg.message, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    
    // Generate transaction ID from consensus timestamp
    const transactionId = getTransactionIdFromTimestamp(msg.consensus_timestamp);
    
    return {
      ...parsed,
      timestamp: parsed.timestamp || new Date(parseInt(msg.consensus_timestamp.split('.')[0]) * 1000).toISOString(),
      transaction_id: transactionId,
    };
  } catch (e) {
    console.error("Failed to parse message:", msg.sequence_number, e);
    return null;
  }
}

function StatusBadge({ is_valid }: { is_valid?: boolean }) {
  if (is_valid === true) return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Valid ✅</span>;
  if (is_valid === false) return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Invalid ❌</span>;
  return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">N/A</span>;
}

function EventBadge({ event }: { event: string }) {
  const eventColors: Record<string, string> = {
    'registration': 'bg-blue-100 text-blue-800',
    'verification': 'bg-green-100 text-green-800',
    'update': 'bg-yellow-100 text-yellow-800',
    'inspection': 'bg-purple-100 text-purple-800',
    'certification': 'bg-indigo-100 text-indigo-800',
    'default': 'bg-gray-100 text-gray-800'
  };
  
  const color = eventColors[event.toLowerCase()] || eventColors.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} capitalize`}>
      {event}
    </span>
  );
}

function createHashScanUrl(transactionId?: string, topicId?: string) {
  if (transactionId) {
    return `https://hashscan.io/testnet/transaction/${transactionId}`;
  }
  if (topicId) {
    return `https://hashscan.io/testnet/topic/${topicId}`;
  }
  return '#';
}

function RunningHashButton({ runningHash, sequenceNumber }: { runningHash: string; sequenceNumber: number }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        title="View running hash"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Running Hash
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Running Hash Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Sequence Number:</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">{sequenceNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Running Hash:</label>
                <code className="text-sm break-all font-mono bg-gray-100 p-2 rounded block">
                  {runningHash}
                </code>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PlantHistory() {
  const params = useParams();
  const plantId = params.id as string;
  
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHash, setSelectedHash] = useState<{ hash: string; type: string } | null>(null);
  const [rawMessages, setRawMessages] = useState<HCSMessage[]>([]);

  useEffect(() => {
    if (!plantId) {
      notFound();
      return;
    }

    const topicId = process.env.NEXT_PUBLIC_HCS_TOPIC_ID || "0.0.7108913";

    async function loadMessages() {
      try {
        setLoading(true);
        const fetchedMessages = await fetchTopicMessages(topicId);
        setRawMessages(fetchedMessages);
        
        const filteredMessages = fetchedMessages
          .map(parseMessage)
          .filter((msg): msg is ParsedMessage =>
            msg !== null && msg.plant_id === plantId
          )
          .sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        setMessages(filteredMessages);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        setFetchError((error as Error).message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [plantId]);

  if (!plantId) {
    notFound();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blockchain history...</p>
          </div>
        </div>
      </div>
    );
  }

  const topicId = process.env.NEXT_PUBLIC_HCS_TOPIC_ID || "0.0.7108913";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Blockchain History
              </h1>
              <p className="text-gray-600">Plant ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{plantId}</span></p>
            </div>
            <a 
              href={createHashScanUrl(undefined, topicId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Topic on HashScan
            </a>
          </div>
          <p className="text-sm text-gray-500">
            Displays all plausibility verification events permanently recorded on the Hedera Consensus Service for this plant.          </p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 font-semibold mb-2">Error Loading History</div>
            <p className="text-red-500 text-sm">{fetchError}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blockchain History Found</h3>
            <p className="text-gray-500">No transactions have been recorded for this plant yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seal Hash
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validity Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((msg, index) => {
                    const rawMsg = rawMessages.find(m => m.consensus_timestamp === msg.timestamp);
                    return (
                    <tr key={msg.timestamp + index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EventBadge event={msg.event} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(msg.timestamp).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {msg.seal_hash ? `${msg.seal_hash.slice(0, 8)}...${msg.seal_hash.slice(-8)}` : 'N/A'}
                          </code>
                          {msg.seal_hash && (
                            <button
                              onClick={() => setSelectedHash({ hash: msg.seal_hash!, type: 'Seal Hash' })}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="View full hash"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {msg.validity_date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge is_valid={msg.is_valid} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* HashScan link for transaction */}
                          {msg.transaction_id && (
                            <a
                              href={createHashScanUrl(msg.transaction_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              HashScan
                            </a>
                          )}
                          
                          {/* Running hash button */}
                          {rawMsg && (
                            <RunningHashButton 
                              runningHash={rawMsg.running_hash} 
                              sequenceNumber={rawMsg.sequence_number} 
                            />
                          )}
                          
                          {/* Sequence number info */}
                          {rawMsg && (
                            <span className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 bg-gray-50">
                              Seq: {rawMsg.sequence_number}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Showing {messages.length} transaction{messages.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  Topic ID: <span className="font-mono">{topicId}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hash Modal */}
      {selectedHash && (
        <HashModal 
          hash={selectedHash.hash} 
          type={selectedHash.type}
          onClose={() => setSelectedHash(null)} 
        />
      )}
    </div>
  );
}