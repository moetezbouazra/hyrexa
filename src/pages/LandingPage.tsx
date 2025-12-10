import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, MapPin, Award, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-green-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-nature-green-400/20 via-nature-blue-400/20 to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <div className="bg-nature-green-100 rounded-full p-4 mb-6 inline-block">
                <Leaf className="w-16 h-16 text-nature-green-600" />
              </div>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-nature-green-600 to-nature-blue-600 bg-clip-text text-transparent">
              Turn Trash into Impact
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Join the community-driven movement to reduce plastic waste. Report, cleanup, earn points, and make a real difference.
            </p>
            
            <div className="flex gap-4 justify-center pt-8">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Map <MapPin className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-20 left-10 w-20 h-20 bg-nature-green-200 rounded-full opacity-50"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-nature-blue-200 rounded-full opacity-50"
        />
      </section>

      {/* Live Statistics Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { label: 'Cleanups Completed', value: '1,247', icon: TrendingUp },
              { label: 'Carbon Points Earned', value: '45,829', icon: Award },
              { label: 'Active Members', value: '892', icon: Users },
              { label: 'Kg Waste Removed', value: '2,341', icon: Leaf },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <stat.icon className="w-8 h-8 mx-auto mb-4 text-nature-green-600" />
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-nature-green-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to make an impact
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Report Waste',
                description: 'Spot plastic waste? Take a photo, mark the location, and report it to the community.',
                icon: MapPin,
                color: 'from-nature-green-400 to-nature-green-600',
              },
              {
                step: '02',
                title: 'Clean Up',
                description: 'Join cleanups, submit before/after photos, and let AI verify your impact.',
                icon: Leaf,
                color: 'from-nature-blue-400 to-nature-blue-600',
              },
              {
                step: '03',
                title: 'Earn Rewards',
                description: 'Gain carbon points, unlock achievements, and climb the leaderboard.',
                icon: Award,
                color: 'from-amber-400 to-amber-600',
              },
            ].map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-gray-200 mb-2">
                      {step.step}
                    </div>
                    <CardTitle className="text-2xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Hyrexa?
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features for maximum impact
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'AI-Powered Verification',
                description: 'Advanced AI analyzes cleanup photos to verify your impact automatically.',
                gradient: 'from-purple-400 to-pink-400',
              },
              {
                title: 'Interactive Map',
                description: 'Discover waste hotspots and track community cleanup progress in real-time.',
                gradient: 'from-blue-400 to-cyan-400',
              },
              {
                title: 'Gamification',
                description: 'Earn points, unlock badges, and compete with friends on the leaderboard.',
                gradient: 'from-amber-400 to-orange-400',
              },
              {
                title: 'Community Driven',
                description: 'Join teams, participate in challenges, and connect with eco-warriors.',
                gradient: 'from-green-400 to-emerald-400',
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${feature.gradient} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-nature-green-600 to-nature-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of eco-warriors cleaning up our planet, one piece of plastic at a time.
            </p>
            <div className="pt-8">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="text-lg px-12 py-6">
                  Start Your Journey Today
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-nature-green-400" />
                <span className="text-xl font-bold text-white">Hyrexa</span>
              </div>
              <p className="text-sm">
                Building a cleaner planet through community action and technology.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/map" className="hover:text-white">Map</Link></li>
                <li><Link to="/leaderboard" className="hover:text-white">Leaderboard</Link></li>
                <li><Link to="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Forum</a></li>
                <li><a href="#" className="hover:text-white">Events</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Hyrexa. Built with ❤️ for a cleaner planet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
