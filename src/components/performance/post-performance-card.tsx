"use client"

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  Video,
  PlaySquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PostWithMetrics {
  id: string;
  media_type: string;
  caption: string | null;
  timestamp: string;
  impressions: number;
  like_count: number;
  comments_count: number;
  saved: number;
  shares: number | null;
  media_url: string | null;
  metrics: {
    engagement: number;
    engagementRate: number;
    reach: number;
    reachRate: number;
    saveRate: number;
    shareRate: number;
    performanceScore: number;
  };
}

interface PostPerformanceCardProps {
  post: PostWithMetrics;
  onClick?: () => void;
}

export function PostPerformanceCard({ post, onClick }: PostPerformanceCardProps) {
  const getMediaIcon = () => {
    switch (post.media_type) {
      case 'VIDEO':
        return <Video className="h-5 w-5" />;
      case 'CAROUSEL_ALBUM':
        return <PlaySquare className="h-5 w-5" />;
      default:
        return <ImageIcon className="h-5 w-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getMediaIcon()}
                {post.media_type}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: es })}
              </span>
            </div>
            {post.caption && (
              <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
            )}
          </div>

          {/* Performance Score */}
          <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 ${getScoreBgColor(post.metrics.performanceScore)}`}>
            <span className={`text-2xl font-bold ${getScoreColor(post.metrics.performanceScore)}`}>
              {post.metrics.performanceScore}
            </span>
            <span className="text-xs text-gray-600">Score</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricItem
            icon={<Eye className="h-4 w-4" />}
            label="Impresiones"
            value={formatNumber(post.impressions)}
            color="text-gray-600"
          />
          <MetricItem
            icon={<Heart className="h-4 w-4" />}
            label="Me gusta"
            value={formatNumber(post.like_count)}
            color="text-pink-600"
          />
          <MetricItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="Comentarios"
            value={formatNumber(post.comments_count)}
            color="text-blue-600"
          />
          <MetricItem
            icon={<Bookmark className="h-4 w-4" />}
            label="Guardados"
            value={formatNumber(post.saved)}
            color="text-purple-600"
          />
          <MetricItem
            icon={<Share2 className="h-4 w-4" />}
            label="Compartidos"
            value={formatNumber(post.shares || 0)}
            color="text-green-600"
          />
        </div>

        {/* Engagement Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tasa de Engagement</span>
            <span className="text-sm font-bold text-purple-700">
              {post.metrics.engagementRate}%
            </span>
          </div>
          <Progress value={Math.min(post.metrics.engagementRate * 10, 100)} className="h-2" />
        </div>

        {/* Additional Rates */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <RateItem label="Alcance" value={post.metrics.reachRate} />
          <RateItem label="Guardado" value={post.metrics.saveRate} />
          <RateItem label="Compartido" value={post.metrics.shareRate} />
        </div>
      </div>
    </Card>
  );
}

function MetricItem({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-1 mb-1 ${color}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function RateItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value.toFixed(2)}%</div>
    </div>
  );
}
