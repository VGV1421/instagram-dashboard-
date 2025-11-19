"use client"

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Lightbulb, ExternalLink, Tag } from 'lucide-react';

interface Referente {
  id: string;
  name: string;
  username: string;
  platform: string;
  followers: number | null;
  niche: string;
  description: string;
  whyReference: string;
  contentStyle: string[];
  profileUrl: string | null;
  avatar: string | null;
}

interface ReferenteCardProps {
  referente: Referente;
}

export function ReferenteCard({ referente }: ReferenteCardProps) {
  const initials = referente.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatFollowers = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={referente.avatar || undefined} alt={referente.name} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{referente.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{referente.username}</p>
            </div>
            {referente.profileUrl && (
              <a
                href={referente.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
                title="Ver perfil"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {referente.niche && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                <Tag className="h-3 w-3 mr-1" />
                {referente.niche}
              </Badge>
            )}
            {referente.followers !== null && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                <Users className="h-3 w-3 mr-1" />
                {formatFollowers(referente.followers)} seguidores
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {referente.description && (
        <p className="text-gray-700 mb-4">{referente.description}</p>
      )}

      {/* Why Reference */}
      {referente.whyReference && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Por qué es referente</h4>
          </div>
          <p className="text-sm text-gray-700 pl-6">{referente.whyReference}</p>
        </div>
      )}

      {/* Content Style */}
      {referente.contentStyle && referente.contentStyle.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Estilo de Contenido</h4>
          <div className="flex flex-wrap gap-2">
            {referente.contentStyle.map((style, index) => (
              <Badge key={index} variant="outline" className="border-gray-300">
                {style}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
