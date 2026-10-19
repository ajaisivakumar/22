import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  ShieldCheck,
  Eye,
  EyeOff,
  Calculator,
  Medal,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { LeaderboardEntry, MyLeaderboardStatus } from '../../types/leaderboard.types';
import { leaderboardService } from '../../services/leaderboard.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStatus, setMyStatus] = useState<MyLeaderboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('Sem 1-4');

  const milestones = ['Sem 1-2', 'Sem 1-4', 'Sem 1-6', 'Sem 1-8'];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedMilestone]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [boardData, statusData] = await Promise.all([
        leaderboardService.getLeaderboard(selectedMilestone),
        leaderboardService.getMyStatus(),
      ]);
      setEntries(boardData);
      setMyStatus(statusData);
    } catch {
      toast.error('Failed to load academic leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOptIn = async () => {
    if (!myStatus) return;
    try {
      const updated = await leaderboardService.updateOptIn(!myStatus.isOptedIn, myStatus.isAnonymous);
      setMyStatus(updated);
      toast.success(
        updated.isOptedIn
          ? 'You have opted into the campus leaderboard'
          : 'You have opted out of the leaderboard'
      );
    } catch {
      toast.error('Could not update leaderboard settings');
    }
  };

  const handleToggleAnonymous = async () => {
    if (!myStatus) return;
    try {
      const updated = await leaderboardService.updateOptIn(myStatus.isOptedIn, !myStatus.isAnonymous);
      setMyStatus(updated);
      toast.success(
        updated.isAnonymous
          ? 'Your name is now masked with an anonymous avatar'
          : 'Your official display name is now visible'
      );
    } catch {
      toast.error('Could not toggle alias visibility');
    }
  };

  const topThree = entries.slice(0, 3);
  const restOfEntries = entries.slice(3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-primary text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-200">
              Academic Year 2023–2027
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-300" />
              Campus Academic Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              Celebrating high scholastic achievements across engineering departments. Opt-in verification supported with semester grade calculation.
            </p>
          </div>

          <div className="shrink-0">
            <Link to="/cgpa-calculator">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-gray-900 border-none font-bold"
                leftIcon={<Calculator className="w-4 h-4 text-primary" />}
              >
                Verify via Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Opt-In / Privacy Management Card */}
      {myStatus && (
        <Card className="bg-gray-50 border-gray-200">
          <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                #{myStatus.currentRank || '–'}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  Your Current Standing: Rank #{myStatus.currentRank} ({myStatus.cgpa?.toFixed(2)} CGPA)
                </p>
                <p className="text-gray-500">
                  Status: {myStatus.isOptedIn ? 'Opted In to Public Board' : 'Hidden from Board'} •{' '}
                  {myStatus.isAnonymous ? 'Masked under Anonymous Alias' : 'Real Name Displayed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleAnonymous}
                leftIcon={myStatus.isAnonymous ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              >
                {myStatus.isAnonymous ? 'Show Real Name' : 'Hide My Name'}
              </Button>
              <Button
                size="sm"
                variant={myStatus.isOptedIn ? 'secondary' : 'primary'}
                onClick={handleToggleOptIn}
              >
                {myStatus.isOptedIn ? 'Opt Out' : 'Opt In'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Milestone Selector */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Semester Milestones
        </span>
        <div className="flex gap-2">
          {milestones.map((ms) => (
            <button
              key={ms}
              type="button"
              onClick={() => setSelectedMilestone(ms)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedMilestone === ms
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {ms}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs text-center flex flex-col justify-between order-2 md:order-1 relative">
                <span className="text-3xl mx-auto mb-2">🥈</span>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                    Rank 2 (Silver)
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {topThree[1].isAnonymous ? topThree[1].alias : topThree[1].displayName}
                  </h3>
                  <p className="text-xs text-gray-500">{topThree[1].department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-2xl font-black text-gray-900">
                    {topThree[1].cgpa.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 block">Cumulative CGPA</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {topThree[0] && (
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-xl border-2 border-amber-300 p-6 shadow-sm text-center flex flex-col justify-between order-1 md:order-2 relative -translate-y-1">
                <span className="text-4xl mx-auto mb-2">🥇</span>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                    Rank 1 (Gold Medallist)
                  </span>
                  <h3 className="text-lg font-extrabold text-gray-900 mt-1">
                    {topThree[0].isAnonymous ? topThree[0].alias : topThree[0].displayName}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">{topThree[0].department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <span className="text-3xl font-black text-amber-600">
                    {topThree[0].cgpa.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 block">Cumulative CGPA</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs text-center flex flex-col justify-between order-3 md:order-3 relative">
                <span className="text-3xl mx-auto mb-2">🥉</span>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800">
                    Rank 3 (Bronze)
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {topThree[2].isAnonymous ? topThree[2].alias : topThree[2].displayName}
                  </h3>
                  <p className="text-xs text-gray-500">{topThree[2].department}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-2xl font-black text-gray-900">
                    {topThree[2].cgpa.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 block">Cumulative CGPA</span>
                </div>
              </div>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Academic Rankings Table</CardTitle>
                <CardDescription>Verified results for {selectedMilestone}</CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4 text-center">Verification</th>
                    <th className="py-3 px-4 text-right">CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50/75 transition-colors ${
                        entry.isCurrentUser ? 'bg-red-50/50 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            entry.rank <= 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">
                            {entry.isAnonymous ? entry.alias : entry.displayName}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="text-[10px] bg-red-100 text-primary px-1.5 py-0.5 rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{entry.department}</td>
                      <td className="py-3 px-4 text-gray-500">{entry.batch}</td>
                      <td className="py-3 px-4 text-center">
                        {entry.verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Provisional</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-primary text-sm">
                        {entry.cgpa.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
