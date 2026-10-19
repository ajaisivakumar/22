import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Calendar,
  Users2,
  PackageSearch,
  MessageSquareWarning,
  Trophy,
  ArrowRight,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Poll } from '../../types/poll.types';
import { CampusEvent } from '../../types/event.types';
import { Opportunity } from '../../types/opportunity.types';
import { LostFoundItem } from '../../types/lostfound.types';
import { LeaderboardEntry } from '../../types/leaderboard.types';
import { pollService } from '../../services/poll.service';
import { eventService } from '../../services/event.service';
import { opportunityService } from '../../services/opportunity.service';
import { lostFoundService } from '../../services/lostfound.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/format';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [topScholars, setTopScholars] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [pollData, eventData, oppData, lfData, lbData] = await Promise.all([
          pollService.getActivePolls(),
          eventService.getEvents(),
          opportunityService.getOpportunities(),
          lostFoundService.getItems(),
          leaderboardService.getLeaderboard(),
        ]);
        setPolls(pollData.slice(0, 2));
        setEvents(eventData.filter((e) => e.status === 'PUBLISHED' || e.status === 'APPROVED').slice(0, 3));
        setOpportunities(oppData.slice(0, 2));
        setLostFoundItems(lfData.slice(0, 3));
        setTopScholars(lbData.slice(0, 3));
      } catch {
        // graceful
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero / Welcome Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-primary/90 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Welcome to Campus Connect Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
            Your single unified portal for classroom polls, academic rankings, verified events, team finder, and campus utilities. Stay updated with what's happening around college today.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/poll-wars">
              <Button variant="primary" size="sm" leftIcon={<Flame className="w-4 h-4" />}>
                Vote in Active Polls
              </Button>
            </Link>
            <Link to="/exam-countdown">
              <Button variant="secondary" size="sm" leftIcon={<Timer className="w-4 h-4" />}>
                Check Exam Timetable
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Polls</span>
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : polls.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Voting in progress</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Events</span>
            <Calendar className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : events.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Happening this month</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Exam</span>
            <Timer className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">38 Days</p>
          <p className="text-[11px] text-gray-500 mt-1">Computer Networks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Team Openings</span>
            <Users2 className="w-4 h-4 text-brand-green" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : opportunities.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Hackathons & Startups</p>
        </div>
      </div>

      {/* Grid: Poll Wars & Academic Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Classroom Poll Wars Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Classroom Poll Wars
              </h2>
              <p className="text-xs text-gray-500">Live student opinion surveys & campus voting</p>
            </div>
            <Link
              to="/poll-wars"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : polls.length === 0 ? (
            <Card className="text-center py-8">
              <CardBody>
                <HelpCircle className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-900 mt-2">No active polls right now</p>
                <p className="text-xs text-gray-500">Check back later for new campus discussions.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {polls.map((poll) => (
                <Card key={poll.id} hoverable>
                  <CardBody className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-primary uppercase bg-red-50 px-2 py-0.5 rounded">
                          Active Poll
                        </span>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mt-1.5">
                          {poll.question}
                        </h3>
                        {poll.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{poll.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                        {poll.totalVotes} votes
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {poll.options.length} options available
                      </span>
                      <Link to="/poll-wars">
                        <Button size="sm" variant="outline">
                          Vote or View Results
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 8. Academic Leaderboard Preview (Top 3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard Top 3
              </h2>
              <p className="text-xs text-gray-500">Batch 2023-2027 (Sem 1-4)</p>
            </div>
            <Link
              to="/leaderboard"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Full Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card>
            <CardBody className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                topScholars.map((scholar, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={scholar.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{medals[idx] || '#' + scholar.rank}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {scholar.isAnonymous ? scholar.alias : scholar.displayName}
                          </p>
                          <p className="text-[11px] text-gray-500">{scholar.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-primary">{scholar.cgpa.toFixed(2)}</span>
                        <p className="text-[10px] text-gray-400">CGPA</p>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="pt-2 text-center border-t border-gray-100">
                <Link
                  to="/cgpa-calculator"
                  className="text-xs font-medium text-brand-blue hover:underline inline-flex items-center gap-1"
                >
                  Calculate & verify your CGPA →
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 4. Campus Lost & Found Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PackageSearch className="w-5 h-5 text-brand-blue" />
              Campus Lost & Found
            </h2>
            <p className="text-xs text-gray-500">Recent reported items on college grounds</p>
          </div>
          <Link
            to="/lost-found"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Browse All Items <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : lostFoundItems.length === 0 ? (
          <Card className="text-center py-8">
            <CardBody>
              <p className="text-sm text-gray-500">No lost & found posts recently</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lostFoundItems.map((item) => (
              <Card key={item.id} hoverable className="flex flex-col justify-between">
                <div>
                  {item.imageUrl ? (
                    <div className="h-36 w-full bg-gray-100 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'LOST'
                            ? 'bg-red-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 bg-gray-100 flex items-center justify-center text-gray-400">
                      <PackageSearch className="w-8 h-8" />
                    </div>
                  )}

                  <div className="p-4 space-y-1.5">
                    <span className="text-[11px] font-medium text-gray-500">{item.category}</span>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    <p className="text-[11px] text-gray-400 pt-1">📍 {item.location}</p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-gray-50">
                  <Badge status={item.status} size="sm" />
                  <Link to="/lost-found" className="text-xs font-semibold text-brand-blue hover:underline">
                    View Details
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 5. Find Your Team (Recent Opportunities) & 6. Campus Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Find Your Team */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-brand-green" />
                Find Your Team
              </h2>
              <p className="text-xs text-gray-500">Collaborate on hackathons, startups & research</p>
            </div>
            <Link
              to="/partner-finder"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Explore Teams <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Card key={opp.id} hoverable>
                <CardBody className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {opp.category}
                    </span>
                    <span className="text-[11px] text-gray-400">by {opp.creatorAlias}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{opp.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{opp.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opp.requiredSkills.map((s) => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Link to="/partner-finder">
                      <Button size="sm" variant="secondary">
                        Message Team Lead
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Campus Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-blue" />
                Upcoming Campus Events
              </h2>
              <p className="text-xs text-gray-500">Workshops, competitions & festivals</p>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <Card key={evt.id} hoverable>
                <CardBody className="p-4 flex gap-4 items-center">
                  <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-lg flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {formatDate(evt.eventDate, 'MMM')}
                    </span>
                    <span className="text-base font-extrabold text-gray-900">
                      {formatDate(evt.eventDate, 'dd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{evt.category}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500 truncate">{evt.venue}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate mt-0.5">{evt.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-1">{evt.description}</p>
                  </div>
                  <Link to="/events" className="shrink-0">
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Anonymous Lab Complaint CTA Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Broken System or Lab Hardware Issue?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              File a 100% anonymous complaint with floor, lab number and system ID. No student name, login or identity is ever logged or shared.
            </p>
          </div>
        </div>
        <Link to="/complaints" className="shrink-0 w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto whitespace-nowrap bg-gray-900 hover:bg-black text-white">
            File Anonymous Ticket
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
