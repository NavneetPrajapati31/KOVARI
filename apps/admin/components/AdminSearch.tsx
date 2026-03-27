'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  startTransition,
  useDeferredValue,
  memo,
} from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, UsersRound, Clock, Flag, Loader2, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from '@/components/ui/popover';
import * as Sentry from '@sentry/nextjs';

interface SearchResult {
  type: 'user' | 'group' | 'session' | 'flag';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

interface UserResponse {
  user_id?: string;
  id: string;
  name?: string | null;
  email?: string;
}

interface GroupResponse {
  id: string;
  name?: string | null;
  destination?: string | null;
}

interface SessionResponse {
  sessionKey?: string;
  id?: string;
  destination?: string | null;
  userId?: string | null;
}

interface FlagResponse {
  id: string;
  reason?: string | null;
  profiles?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

// Memoized result item to prevent unnecessary re-renders
const SearchResultItem = memo(
  ({
    result,
    iconMap,
    labelMap,
    onClick,
  }: {
    result: SearchResult;
    iconMap: Record<SearchResult['type'], typeof Users>;
    labelMap: Record<SearchResult['type'], string>;
    onClick: (result: SearchResult) => void;
  }) => {
    const Icon = iconMap[result.type];
    return (
      <Button
        className="bg-transparent hover:bg-transparent w-full justify-start h-auto p-4 rounded-none border-b border-border last:border-0 transition-colors"
        onClick={() => onClick(result)}
      >
        <div className="flex items-center gap-3.5 w-full">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/5 text-primary shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[15px] truncate tracking-tight text-foreground">
                {result.title}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                {labelMap[result.type]}
              </span>
            </div>
            {result.subtitle && (
              <p className="text-[12px] font-medium text-muted-foreground truncate tracking-tight opacity-70">
                {result.subtitle}
              </p>
            )}
          </div>
        </div>
      </Button>
    );
  },
);

SearchResultItem.displayName = 'SearchResultItem';

export function AdminSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  // Use deferred value only for rendering results, not for search
  const deferredResults = useDeferredValue(results);

  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim() || searchQuery.length < 2) {
      startTransition(() => {
        setResults([]);
        setIsLoading(false);
      });
      return;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    startTransition(() => {
      setIsLoading(true);
    });

    try {
      const searchResults: SearchResult[] = [];
      const searchTerm = searchQuery.toLowerCase().trim();

      // Make all API calls in parallel
      const [usersResponse, groupsResponse, sessionsResponse, flagsResponse] =
        await Promise.allSettled([
          fetch(
            `/api/admin/users?query=${encodeURIComponent(searchQuery)}&limit=5`,
            {
              signal: abortController.signal,
            },
          ),
          fetch(
            `/api/admin/groups?query=${encodeURIComponent(searchQuery)}&limit=5`,
            {
              signal: abortController.signal,
            },
          ),
          fetch(
            `/api/admin/sessions/search?query=${encodeURIComponent(searchQuery)}&limit=5`,
            {
              signal: abortController.signal,
            },
          ),
          fetch(`/api/admin/flags?status=pending&limit=50`, {
            signal: abortController.signal,
          }),
        ]);

      // Process users
      if (usersResponse.status === 'fulfilled' && usersResponse.value.ok) {
        try {
          const usersData = await usersResponse.value.json();
          if (usersData.users && Array.isArray(usersData.users)) {
            usersData.users.forEach((user: UserResponse) => {
              // Use profile id (not user_id) for the URL since the detail page uses profile.id
              const profileId = user.id;
              searchResults.push({
                type: 'user',
                id: profileId,
                title: user.name || user.email || 'Unknown User',
                subtitle: user.email,
                url: `/users/${profileId}`,
              });
            });
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            Sentry.captureException(error, {
              tags: { scope: 'admin-search', entity: 'users' },
            });
          }
        }
      }

      // Process groups
      if (groupsResponse.status === 'fulfilled' && groupsResponse.value.ok) {
        try {
          const groupsData = await groupsResponse.value.json();
          if (groupsData.groups && Array.isArray(groupsData.groups)) {
            groupsData.groups.forEach((group: GroupResponse) => {
              searchResults.push({
                type: 'group',
                id: group.id,
                title: group.name || 'Unnamed Group',
                subtitle: group.destination || undefined,
                url: `/groups/${group.id}`,
              });
            });
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            Sentry.captureException(error, {
              tags: { scope: 'admin-search', entity: 'groups' },
            });
          }
        }
      }

      // Process sessions
      if (
        sessionsResponse.status === 'fulfilled' &&
        sessionsResponse.value.ok
      ) {
        try {
          const sessionsData = await sessionsResponse.value.json();
          if (sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
            sessionsData.sessions.forEach((session: SessionResponse) => {
              searchResults.push({
                type: 'session',
                id: session.sessionKey || session.id || '',
                title: session.destination || 'Session',
                subtitle: session.userId || undefined,
                url: `/sessions`,
              });
            });
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            Sentry.captureException(error, {
              tags: { scope: 'admin-search', entity: 'sessions' },
            });
          }
        }
      }

      // Process flags (client-side filtering)
      if (flagsResponse.status === 'fulfilled' && flagsResponse.value.ok) {
        try {
          const flagsData = await flagsResponse.value.json();
          if (flagsData.flags && Array.isArray(flagsData.flags)) {
            const matchingFlags = flagsData.flags.filter(
              (flag: FlagResponse) => {
                const profile = flag.profiles;
                if (!profile) return false;
                const nameMatch = profile.name
                  ?.toLowerCase()
                  .includes(searchTerm);
                const emailMatch = profile.email
                  ?.toLowerCase()
                  .includes(searchTerm);
                const reasonMatch = flag.reason
                  ?.toLowerCase()
                  .includes(searchTerm);
                return nameMatch || emailMatch || reasonMatch;
              },
            );

            matchingFlags.slice(0, 5).forEach((flag: FlagResponse) => {
              const profile = flag.profiles;
              searchResults.push({
                type: 'flag',
                id: flag.id,
                title: profile?.name || profile?.email || 'Flag',
                subtitle: flag.reason || undefined,
                url: `/flags`,
              });
            });
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            Sentry.captureException(error, {
              tags: { scope: 'admin-search', entity: 'flags' },
            });
          }
        }
      }

      // Only update if request wasn't aborted
      if (!abortController.signal.aborted) {
        startTransition(() => {
          setResults(searchResults);
          setIsLoading(false);
        });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        Sentry.captureException(error, {
          tags: { scope: 'admin-search', entity: 'general' },
        });
        startTransition(() => {
          setResults([]);
          setIsLoading(false);
        });
      }
    }
  }, []);

  // Debounce search with shorter delay
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150); // Reduced from 300ms to 150ms

    return () => {
      clearTimeout(timer);
      // Cancel in-flight request when query changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, performSearch]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setIsOpen(false);
      setQuery('');
      router.push(result.url);
    },
    [router],
  );

  const iconMap = useMemo<Record<SearchResult['type'], typeof Users>>(
    () => ({
      user: Users,
      group: UsersRound,
      session: Clock,
      flag: Flag,
    }),
    [],
  );

  const labelMap = useMemo<Record<SearchResult['type'], string>>(
    () => ({
      user: 'User',
      group: 'Group',
      session: 'Session',
      flag: 'Flag',
    }),
    [],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[45] animate-in fade-in duration-300 pointer-events-auto"
          onMouseDown={() => setIsOpen(false)}
        />
      )}
      <PopoverAnchor asChild>
        <div className={cn(
          "relative w-full transition shadow-none",
          isOpen ? "z-[50]" : "z-10"
        )} suppressHydrationWarning>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search"
            className={cn(
              "w-full pl-10 pr-10 h-10 rounded-xl bg-card border-border transition-all text-sm placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
              isOpen && "ring-1 ring-primary/20 border-primary/20 shadow-lg"
            )}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
              }
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors z-20 cursor-pointer"
            >
              <div className="relative h-4.5 w-4.5">
                <X className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-full p-0 rounded-2xl overflow-hidden border-border !shadow-none mt-1"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : query.length < 2 ? (
          <div className="p-16 text-sm text-muted-foreground text-center">
            Type at least 2 characters to search
          </div>
        ) : deferredResults.length === 0 ? (
          <div className="p-16 text-sm text-muted-foreground text-center">
            No results found for &quot;{query}&quot;
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {deferredResults.map((result) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                iconMap={iconMap}
                labelMap={labelMap}
                onClick={handleResultClick}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
