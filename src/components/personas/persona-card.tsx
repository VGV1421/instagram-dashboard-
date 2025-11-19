"use client"

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Briefcase, Target, AlertCircle, Heart } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  age: number | null;
  occupation: string;
  description: string;
  goals: string;
  painPoints: string;
  interests: string[];
  avatar: string | null;
}

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const initials = persona.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={persona.avatar || undefined} alt={persona.name} />
          <AvatarFallback className="bg-purple-100 text-purple-700 text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{persona.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            {persona.age && <span>{persona.age} años</span>}
            {persona.age && persona.occupation && <span>•</span>}
            {persona.occupation && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {persona.occupation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {persona.description && (
        <p className="text-gray-700 mb-4">{persona.description}</p>
      )}

      {/* Goals */}
      {persona.goals && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-gray-900">Objetivos</h4>
          </div>
          <p className="text-sm text-gray-700 pl-6">{persona.goals}</p>
        </div>
      )}

      {/* Pain Points */}
      {persona.painPoints && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold text-gray-900">Puntos de Dolor</h4>
          </div>
          <p className="text-sm text-gray-700 pl-6">{persona.painPoints}</p>
        </div>
      )}

      {/* Interests */}
      {persona.interests && persona.interests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-pink-600" />
            <h4 className="font-semibold text-gray-900">Intereses</h4>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {persona.interests.map((interest, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
