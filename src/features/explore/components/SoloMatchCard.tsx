// -----------------------------------------------------------------------------
//   File : Solo Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/SoloMatchCard.tsx

"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { 
  MapPin, 
  Calendar, 
  User, 
  Heart, 
  MessageCircle, 
  Loader2, 
  Briefcase, 
  Globe, 
  Coffee, 
  Star,
  TrendingUp,
  ThumbsDown,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Moon,
  Scale,
  User as UserIcon,
  Ban,
  Beer,
  Wine,
  Coffee as CoffeeIcon,
  Plane,
  Cigarette
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface SoloMatchCardProps {
  match: {
    id: string;
    name: string;
    destination: string;
    budget: string;
    start_date: Date;
    end_date: Date;
    compatibility_score: number;
    budget_difference: string;
    user: {
      userId: string;
      full_name?: string;
      age?: number;
      gender?: string;
      personality?: string;
      interests?: string[];
      profession?: string;
      avatar?: string;
      nationality?: string;
      smoking?: string;
      drinking?: string;
      religion?: string;
      languages?: string[];
      location?: { lat: number; lon: number };
    };
    is_solo_match: boolean;
  };
  onConnect?: (matchId: string) => Promise<void>;
  onSuperLike?: (matchId: string) => Promise<void>;
  onPass?: (matchId: string) => Promise<void>;
  onComment?: (matchId: string, attribute: string, comment: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

export function SoloMatchCard({
  match,
  onConnect,
  onSuperLike,
  onPass,
  onComment,
  onViewProfile,
}: SoloMatchCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuperLiking, setIsSuperLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [commentText, setCommentText] = useState('');

  const handleConnect = async () => {
    if (onConnect) {
      setIsConnecting(true);
      try {
        await onConnect(match.id);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(match.user.userId);
    }
  };

  const handleSuperLike = async () => {
    if (onSuperLike) {
      setIsSuperLiking(true);
      try {
        await onSuperLike(match.id);
      } finally {
        setIsSuperLiking(false);
      }
    }
  };

  const handlePass = async () => {
    if (onPass) {
      setIsPassing(true);
      try {
        await onPass(match.id);
      } finally {
        setIsPassing(false);
      }
    }
  };

  const handleComment = (attribute: string) => {
    setSelectedAttribute(attribute);
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (onComment && commentText.trim()) {
      try {
        await onComment(match.id, selectedAttribute, commentText.trim());
        setShowCommentModal(false);
        setCommentText('');
        setSelectedAttribute('');
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    }
  };



  const formatDateRange = () => {
    const startDate = new Date(match.start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endDate = new Date(match.end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startDate} - ${endDate}`;
  };

  const getTripLengthDays = () => {
    const start = new Date(match.start_date).getTime();
    const end = new Date(match.end_date).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return null;
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "primary";
  };

  const getBudgetDifferenceColor = (difference: string) => {
    if (difference === "Same budget") return "success";
    if (difference.includes("+")) return "warning";
    return "primary";
  };

  const getPersonalityIcon = (personality?: string) => {
    switch (personality?.toLowerCase()) {
      case 'extrovert': return <Sparkles className="w-4 h-4" />;
      case 'introvert': return <Moon className="w-4 h-4" />;
      case 'ambivert': return <Scale className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getSmokingIcon = (smoking?: string) => {
    if (!smoking) {
      return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
    
    const smokingLower = smoking.toLowerCase();
    
    switch (smokingLower) {
      case 'yes':
      case 'true':
      case '1':
        return <Cigarette className="w-4 h-4 text-red-600" />;
      case 'no':
      case 'false':
      case '0':
        return <Cigarette className="w-4 h-4 text-gray-400" />; // Cigarette icon in gray for non-smokers
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDrinkingIcon = (drinking?: string) => {
    switch (drinking?.toLowerCase()) {
      case 'yes': return <Beer className="w-4 h-4" />;
      case 'no': return <Ban className="w-4 h-4" />;
      case 'socially': return <Wine className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  // Derived display values for Bumble-like sections
  const aboutText = (() => {
    const parts: string[] = [];
    if (match.user.profession) parts.push(`${String(match.user.profession).replace(/_/g, ' ')}`);
    if (match.user.personality) parts.push(`${String(match.user.personality)}`);
    if (match.user.interests && match.user.interests.length > 0) {
      parts.push(`Loves ${match.user.interests.slice(0, 3).join(', ')}`);
    }
    return parts.length > 0 ? parts.join('. ') + '.' : 'No bio provided.';
  })();

  const travelStyleTags = (() => {
    const candidates = ['cultural', 'foodie', 'photography', 'adventure', 'nature', 'nightlife', 'history', 'beach'];
    const interests = (match.user.interests || []).map(i => i.toLowerCase());
    const filtered = interests.filter(i => candidates.includes(i));
    const tags = (filtered.length > 0 ? filtered : interests).slice(0, 3);
    return tags;
  })();

  const formattedProfession = match.user.profession ? String(match.user.profession).replace(/_/g, ' ') : undefined;
  const languagesList = Array.isArray(match.user.languages) ? match.user.languages : [];

    return (
    <div className="w-full h-full flex flex-col">
      {/* Full-screen card container */}
      <Card className="w-full h-full flex flex-col shadow-xl overflow-hidden">
        <CardContent className="p-3 space-y-2">
        

                                                                                                                                               {/* Header Section - User Info */}
           <div className="flex items-start gap-4 pb-2 border-b border-gray-200">
             {/* User Avatar - Stays on the left */}
             <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
               {match.user.avatar ? (
                 <img
                   src={match.user.avatar}
                   alt={match.user.full_name || "Traveler"}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <Avatar className="w-20 h-20 text-xl rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                   <AvatarImage src="" alt={match.user.full_name || "Traveler"} />
                   <AvatarFallback className="text-white font-semibold">
                     {match.user.full_name ? match.user.full_name.charAt(0).toUpperCase() : "T"}
                   </AvatarFallback>
                 </Avatar>
               )}
             </div>

             {/* Main Content Area - A single column for all text info */}
             <div className="flex-1 flex flex-col justify-start space-y-0.5 min-h-0">
               
               {/* --- ROW 1: Name and Badge --- */}
               <div className="flex items-center gap-2 flex-wrap">
                 <h1 className="text-xl font-bold text-gray-900">
                   {match.user.full_name || "Traveler"}{match.user.age ? `, ${match.user.age}` : ''}
                 </h1>
                 <Badge variant="default" className={`text-xs ${
                   match.compatibility_score >= 80 ? 'bg-green-100 text-green-800' :
                   match.compatibility_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                   'bg-blue-100 text-blue-800'
                 }`}>
                   {match.compatibility_score}% trip overlap
                 </Badge>
               </div>

               {/* --- ROW 2: Gender/Nationality aligned with Destination --- */}
               <div className="flex items-center justify-between w-full">
                 {/* Left side of row 2 */}
                 <div className="flex items-center space-x-3 text-sm text-gray-600">
                   {match.user.gender && <span className="capitalize">{match.user.gender}</span>}
                   {match.user.gender && <span>•</span>}
                   <span className="capitalize">{match.user.nationality || 'Indian'}</span>
                 </div>
                 {/* Right side of row 2 */}
                 <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                   <MapPin className="w-3 h-3" />
                   {match.destination}
                 </div>
               </div>

               {/* --- ROW 3: Personality aligned with Dates --- */}
               <div className="flex items-center justify-between w-full">
                  {/* Left side of row 3 */}
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-600">{getPersonalityIcon(match.user.personality)}</span>
                   <span className="text-sm capitalize text-gray-700">{match.user.personality}</span>
                 </div>
                 {/* Right side of row 3 */}
                 <div className="text-xs text-gray-600 flex items-center gap-1">
                   <Calendar className="w-3 h-3" />
                   {formatDateRange()}
                 </div>
               </div>

             </div>
           </div>

         {/* Bumble-like sections */}
         <div className="space-y-3">
           {/* Trip Summary */}
           <div className="rounded-xl border border-gray-200 p-3">
             <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
               <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                 <Plane className="w-4 h-4" />
               </span>
               Trip Summary
             </h2>
             <div className="grid grid-cols-3 gap-3 text-sm">
               <div>
                 <div className="text-gray-500">Budget</div>
                 <div className="font-medium text-gray-900">₹{match.budget}</div>
               </div>
               <div>
                 <div className="text-gray-500">Trip length</div>
                 <div className="font-medium text-gray-900">{getTripLengthDays() ? `${getTripLengthDays()} days` : '—'}</div>
               </div>
             </div>
           </div> 

           {/* About */}
           <div>
             <h3 className="text-base font-semibold text-gray-900 mb-1">About</h3>
             <p className="text-sm text-gray-700 leading-6">{aboutText}</p>
           </div>

           {/* Travel Style */}
           <div>
             <h3 className="text-base font-semibold text-gray-900 mb-1">Travel Style</h3>
             <div className="flex flex-wrap gap-2">
               {travelStyleTags.length > 0 ? travelStyleTags.map((t, i) => (
                 <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 capitalize">
                   {t}
                 </span>
               )) : (
                 <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">explorer</span>
               )}
             </div>
           </div>

           {/* Basics */}
           <div>
             <h3 className="text-base font-semibold text-gray-900 mb-1">Basics</h3>
             <div className="grid grid-cols-3 gap-3 text-sm">
               <div>
                 <div className="text-gray-500">Profession</div>
                 <div className="font-medium text-gray-900 capitalize">{formattedProfession || 'N/A'}</div>
               </div>
               <div>
                 <div className="text-gray-500">Nationality</div>
                 <div className="font-medium text-gray-900 capitalize">{match.user.nationality || 'N/A'}</div>
               </div>
               <div>
                 <div className="text-gray-500">Languages</div>
                 <div className="flex flex-wrap gap-1">
                   {languagesList.length > 0 ? languagesList.slice(0, 3).map((lang, i) => (
                     <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">{lang}</span>
                   )) : (
                     <span className="text-gray-700 font-medium">N/A</span>
                   )}
                 </div>
               </div>
             </div>
           </div>

                       {/* Lifestyle */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Lifestyle</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                  <span className="text-gray-600 flex items-center justify-center w-4 h-4">
                    {getSmokingIcon(match.user.smoking)}
                  </span>
                  <span className="capitalize">{match.user.smoking || 'unknown'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                  <span className="text-gray-600 flex items-center justify-center w-4 h-4">
                    {getDrinkingIcon(match.user.drinking)}
                  </span>
                  <span className="capitalize">{match.user.drinking || 'unknown'}</span>
                </span>
              </div>
              
            </div>

           {/* Shared Interests */}
           <div>
             <h3 className="text-base font-semibold text-gray-900 mb-1">Shared Interests</h3>
             <div className="flex flex-wrap gap-2">
               {(match.user.interests || []).slice(0, 6).map((interest, i) => (
                 <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-700 capitalize">
                   {interest}
                 </span>
               ))}
               {(!match.user.interests || match.user.interests.length === 0) && (
                 <span className="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-700">none added</span>
               )}
             </div>
           </div>         
           </div>

        {/* Action Buttons - Bottom */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePass}
            disabled={isPassing}
            className="flex-1 py-2 text-sm border-red-200 text-red-600 hover:bg-red-50 rounded-full"
          >
            {isPassing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProfile}
            className="flex-1 py-2 text-sm rounded-full"
          >
            <User className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSuperLike}
            disabled={isSuperLiking}
            className="flex-1 py-2 text-sm border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full"
          >
            {isSuperLiking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 py-2 text-sm rounded-full"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          </Button>
        </div>
        </CardContent>
      </Card>

       {/* Comment Modal */}
       <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>
               Comment on {selectedAttribute.replace('_', ' ')}
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Your Comment
               </label>
               <Textarea
                 value={commentText}
                 onChange={(e) => setCommentText(e.target.value)}
                 placeholder={`Share your thoughts about ${selectedAttribute.replace('_', ' ')}...`}
                 className="resize-none"
                 rows={4}
                 maxLength={200}
               />
               <div className="text-xs text-gray-500 text-right mt-1">
                 {commentText.length}/200
               </div>
             </div>
             
             <div className="flex space-x-3">
               <Button
                 variant="outline"
                 onClick={() => {
                   setShowCommentModal(false);
                   setCommentText('');
                   setSelectedAttribute('');
                 }}
                 className="flex-1"
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleSubmitComment}
                 disabled={!commentText.trim()}
                 className="flex-1"
               >
                 Submit Comment
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }
