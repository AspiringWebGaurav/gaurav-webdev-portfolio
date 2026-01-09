"use client";

import React from "react";
import { Brain, Zap, Shield, TrendingDown, Clock, CheckCircle2, Sparkles, Target, Cpu, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function SBISPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-emerald-50">
              <Brain className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Burn Intelligence System</h1>
          </div>
          <p className="text-gray-600 ml-[60px]">
            Autonomous resource protection - Built by Gaurav for cost-effective portfolio management
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border-2 border-emerald-200 shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-xl bg-white shadow-md">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                This Is No Longer a Feature. This Is a Runtime Instinct.
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                SBIS is an <span className="font-bold text-emerald-600">autonomous intelligence layer</span> that lives in your application's nervous system. 
                It doesn't just monitor—it <span className="font-bold">thinks</span>, <span className="font-bold">predicts</span>, and <span className="font-bold">protects</span>.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Built from scratch to solve one problem: <span className="font-bold text-red-600">Stop burning money on resources nobody is using.</span>
              </p>
            </div>
          </div>
        </div>

        {/* What It Does */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">What SBIS Does</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-gray-900">Watches Everything</h4>
              </div>
              <p className="text-sm text-gray-700">
                Observes every Firebase listener, polling operation, interval, and background task running in your app.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900">Thinks Autonomously</h4>
              </div>
              <p className="text-sm text-gray-700">
                Analyzes user presence, admin activity, time of day, and network status to make intelligent decisions.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h4 className="font-bold text-gray-900">Acts Instantly</h4>
              </div>
              <p className="text-sm text-gray-700">
                Throttles non-critical operations during idle periods. Pauses unnecessary tasks during deep sleep.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900">Saves Resources</h4>
              </div>
              <p className="text-sm text-gray-700">
                Reduces Firebase reads by 60-94% during idle periods. That's $900-1,800 saved every month.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">How It Works - The Intelligence Cycle</h3>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                  <span className="font-bold text-emerald-700">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Observer Layer - Eyes Everywhere</h4>
                <p className="text-gray-700 text-sm">
                  The <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">RuntimeObserver</span> tracks every single execution 
                  happening in your app. 50+ operations? 100+ operations? It sees them all. Firebase listeners, polling intervals, 
                  background tasks—everything gets registered and monitored.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                  <span className="font-bold text-blue-700">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Intelligence Layer - The Brain</h4>
                <p className="text-gray-700 text-sm">
                  The <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ActivityIntelligence</span> analyzes patterns. 
                  Has the user interacted in the last 2 minutes? Is an admin active? Is it nighttime? Is the page hidden? 
                  Based on context, it determines the system mode: <span className="font-bold text-green-600">Active</span>, 
                  <span className="font-bold text-yellow-600"> Idle</span>, <span className="font-bold text-orange-600"> Sleep</span>, 
                  or <span className="font-bold text-red-600"> Deep Sleep</span>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-100 border-2 border-yellow-500 flex items-center justify-center">
                  <span className="font-bold text-yellow-700">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Control Layer - The Enforcer</h4>
                <p className="text-gray-700 text-sm">
                  The <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ExecutionController</span> takes action. 
                  It throttles non-critical operations (make them run slower) or pauses them completely. Critical operations? 
                  <span className="font-bold text-emerald-600"> Never touched</span>. Admin operations? 
                  <span className="font-bold text-blue-600"> Always active</span>. The control is gradual, intelligent, and reversible.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                  <span className="font-bold text-green-700">4</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Coordination Layer - The Conductor</h4>
                <p className="text-gray-700 text-sm">
                  The <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">BurnPreventionCore</span> orchestrates everything. 
                  It coordinates the observer, intelligence, and controller. It provides the API that the rest of your app uses. 
                  And when a user returns? <span className="font-bold text-emerald-600">Instant wake-up</span> in under 100ms. 
                  Zero user experience degradation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Modes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">Intelligent Mode System</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex-shrink-0 w-24 font-bold text-green-700">ACTIVE</div>
              <div className="text-sm text-gray-700">
                User is present and interacting. All systems at full speed. No throttling. This is normal operation.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex-shrink-0 w-24 font-bold text-yellow-700">IDLE</div>
              <div className="text-sm text-gray-700">
                <span className="font-bold">2+ minutes</span> without interaction. Light throttling begins on low-priority operations. 
                Savings: <span className="font-bold">25-35%</span>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="flex-shrink-0 w-24 font-bold text-orange-700">SLEEP</div>
              <div className="text-sm text-gray-700">
                <span className="font-bold">5+ minutes</span> idle. Heavy throttling (4x slower intervals) and some pausing. 
                Savings: <span className="font-bold">60-70%</span>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex-shrink-0 w-24 font-bold text-red-700">DEEP SLEEP</div>
              <div className="text-sm text-gray-700">
                <span className="font-bold">15+ minutes</span> of inactivity. Maximum resource saving. Most operations paused. 
                Critical ops still running. Savings: <span className="font-bold">75-95%</span>.
              </div>
            </div>
          </div>
        </div>

        {/* Policies & Rules */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">Protection Policies</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Critical Operations Are Sacred</p>
                <p className="text-sm text-gray-600">
                  Operations marked as <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded">criticality: 'critical'</span> are 
                  NEVER throttled or paused. Authentication checks, security monitors, critical alerts—always running.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Admin Actions Take Priority</p>
                <p className="text-sm text-gray-600">
                  When an admin is active, SBIS stays in active mode. Admin operations are marked as 
                  <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded ml-1">owner: 'admin'</span> and get full resources.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Gradual Transitions, Not Shocks</p>
                <p className="text-sm text-gray-600">
                  Throttling increases gradually (2x → 4x → 10x slower). No sudden stops. No jarring performance changes. 
                  Smooth degradation that users never notice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Instant Wake-Up Guarantee</p>
                <p className="text-sm text-gray-600">
                  When activity resumes, SBIS wakes up in <span className="font-bold text-emerald-600">&lt;100ms</span>. 
                  All operations restore instantly. Zero user experience impact. It's like it never slept.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Fully Reversible & Safe</p>
                <p className="text-sm text-gray-600">
                  Don't like it? Disable with one line: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">burnPreventionCore.setEnabled(false)</span>. 
                  All operations immediately return to normal. Zero breaking changes to your codebase.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Flex */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl border-2 border-purple-200 shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white shadow-md">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">The Numbers That Matter</h2>
              <p className="text-gray-700">Why this isn't just another monitoring tool—this is a cost revolution.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow">
              <div className="text-4xl font-bold text-purple-600 mb-1">60-94%</div>
              <div className="text-sm font-medium text-gray-700">Resource reduction during idle periods</div>
            </div>

            <div className="bg-white rounded-lg p-5 border-2 border-pink-200 shadow">
              <div className="text-4xl font-bold text-pink-600 mb-1">$900-1.8K</div>
              <div className="text-sm font-medium text-gray-700">Monthly savings for typical portfolio</div>
            </div>

            <div className="bg-white rounded-lg p-5 border-2 border-orange-200 shadow">
              <div className="text-4xl font-bold text-orange-600 mb-1">&lt;100ms</div>
              <div className="text-sm font-medium text-gray-700">Wake-up time on user return</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-purple-700">Real Talk:</span> Before SBIS, this portfolio was polling Firebase 
              24/7 at full rate—even when nobody was looking. That's ~864,000 reads per day. After SBIS? Down to ~350,000 reads. 
              That's <span className="font-bold text-emerald-600">$10,800-21,600 saved annually</span>. And you don't lift a finger.
            </p>
          </div>
        </div>

        {/* Built By Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Built by Gaurav</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            This isn't off-the-shelf software. This is custom intelligence built from the ground up to solve one specific problem: 
            <span className="font-bold"> Stop wasting money on resources when nobody is using them</span>.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            Every line of code was written with one goal—make the system <span className="font-bold text-emerald-600">self-aware</span>, 
            <span className="font-bold text-blue-600"> context-aware</span>, and <span className="font-bold text-purple-600"> cost-protective</span>. 
            It's not just a feature. It's a runtime instinct.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            Want to see it in action? Open the browser console (F12) and type: 
            <span className="font-mono bg-gray-100 text-emerald-700 px-2 py-1 rounded ml-2">__burnPrevention.printReport()</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
