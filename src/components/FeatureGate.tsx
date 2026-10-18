'use client';

import React from 'react';
import { Lock, Crown, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { UserProfile, SubscriptionTier } from '@/types';
import { FeaturePermissionKey, checkFeatureAccess, FEATURE_RULES } from '@/lib/permissions';
import { SUBSCRIPTION_PLANS, formatVnd } from '@/lib/pricing';

export interface FeatureGateProps {
  user?: UserProfile | null | undefined;
  userTier?: SubscriptionTier;
  featureKey: FeaturePermissionKey;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  requiredTier?: SubscriptionTier | string;
  featureTitle?: string;
  featureDescription?: string;
  onUpgrade?: () => void;
  onUpgradeClick?: (tier: SubscriptionTier) => void;
}

export default function FeatureGate({
  user,
  userTier,
  featureKey,
  children,
  fallback,
  requiredTier,
  featureTitle,
  featureDescription,
  onUpgrade,
  onUpgradeClick,
}: FeatureGateProps) {
  // Synthesize user if userTier is passed directly
  const effectiveUser = user || (userTier ? ({ tier: userTier, role: 'USER' } as UserProfile) : null);
  const { allowed, rule } = checkFeatureAccess(effectiveUser, featureKey);

  // If children are present and user is allowed, render children
  if (children && allowed) {
    return <>{children}</>;
  }

  if (fallback && !allowed) {
    return <>{fallback}</>;
  }

  const targetTier = (requiredTier as SubscriptionTier) || rule.minTier || 'PRO';
  const targetPlan = SUBSCRIPTION_PLANS[targetTier] || SUBSCRIPTION_PLANS.PRO;
  const title = featureTitle || rule.name;
  const desc = featureDescription || rule.description;

  const handleAction = () => {
    if (onUpgrade) onUpgrade();
    if (onUpgradeClick) onUpgradeClick(targetTier);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#BAE6FD] rounded-2xl p-6 shadow-sm relative overflow-hidden my-2">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#E0F2FE]/60 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-6 h-6 text-[#008FD3]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD] uppercase tracking-wider">
                Yêu cầu {targetPlan.name}
              </span>
              <span className="text-xs text-[#64748B] font-medium font-mono">
                {targetPlan.formattedPrice}
              </span>
            </div>

            <h3 className="font-bold text-[17px] text-[#172033] mt-1.5 tracking-tight">
              {title}
            </h3>

            <p className="text-[13px] text-[#64748B] mt-1 max-w-xl leading-relaxed">
              {desc}
            </p>

            {rule?.freeLimitDescription && (
              <p className="text-xs text-[#D97706] font-medium mt-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                <span>{rule.freeLimitDescription}</span>
              </p>
            )}
          </div>
        </div>

        {/* Upgrade Call to action */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
          <button
            onClick={handleAction}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            <span>Nâng cấp gói {targetTier}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
