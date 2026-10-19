import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, ShieldCheck, Filter, ShieldAlert } from 'lucide-react';
import { LeaderboardEntry } from '../../types/leaderboard.types';
import { leaderboardService } from '../../services/leaderboard.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';

export const AdminLeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('Sem 1-4');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedMilestone]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await leaderboardService.getLeaderboard(selectedMilestone);
      setEntries(data);
    } catch {
      toast.error('Failed to load leaderboard entries');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (entry: LeaderboardEntry) => {
    try {
      await leaderboardService.verifyEntry(entry.id, !entry.verified);
      toast.success(
        entry.verified
          ? `Revoked verification for ${entry.displayName}`
          : `Verified academic credentials for ${entry.displayName}`
      );
      loadLeaderboard();
    } catch {
      toast.error('Failed to update verification status');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Leaderboard Verification & Moderation
        </h1>
        <p className="text-sm text-gray-500">
          Audit student CGPA submissions against official Controller of Examinations transcripts and grant verified badges.
        </p>
      </div>

      <Card>
        <CardBody className="p-4 flex items-center justify-between">
          <div className="w-48">
            <Select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
            >
              <option value="Sem 1-2">Semester 1-2</option>
              <option value="Sem 1-4">Semester 1-4</option>
              <option value="Sem 1-6">Semester 1-6</option>
              <option value="Sem 1-8">Semester 1-8</option>
            </Select>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {entries.length} candidates in milestone
          </span>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4 text-center">CoE Verification</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading entries...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No entries found</td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-900">#{item.rank}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.displayName}
                      {item.isAnonymous && (
                        <span className="text-[10px] font-normal text-gray-400 ml-1">
                          (Masked as {item.alias})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{item.department}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-primary text-sm">
                      {item.cgpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{item.milestone}</td>
                    <td className="py-3 px-4 text-center">
                      {item.verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                          Provisional
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={item.verified ? 'secondary' : 'primary'}
                        onClick={() => handleToggleVerification(item)}
                      >
                        {item.verified ? 'Revoke Mark' : 'Verify CGPA'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminLeaderboardPage;
