import { useState } from 'react';
import { Check, Zap, Users, BarChart3, ShoppingCart, Shield, Smartphone } from 'lucide-react';

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    phone: '',
    plan: ''
  });

  const features = [
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: 'Point of Sale',
      description: 'Fast and intuitive POS system with table management, order tracking, and seamless checkout experience.',
      color: 'bg-green-500'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Admin Dashboard',
      description: 'Comprehensive analytics and reporting to track sales, inventory, staff performance, and business insights.',
      color: 'bg-blue-500'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Staff Management',
      description: 'Manage employees, track working hours, assign roles, and monitor performance metrics.',
      color: 'bg-purple-500'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Quick Orders',
      description: 'Speed keys and quick add features for faster order processing during peak hours.',
      color: 'bg-yellow-500'
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'PWA Support',
      description: 'Install as a mobile app on any device. Works offline with automatic sync when online.',
      color: 'bg-pink-500'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with data encryption, regular backups, and 99.9% uptime guarantee.',
      color: 'bg-red-500'
    }
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '$29',
      period: '/month',
      description: 'Perfect for small cafes and startups',
      features: [
        '1 POS Terminal',
        'Basic Inventory Management',
        'Daily Sales Reports',
        'Staff Management (up to 5)',
        'Email Support',
        'PWA Installation'
      ],
      popular: false,
      color: 'from-gray-50 to-gray-100'
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing restaurants',
      features: [
        '5 POS Terminals',
        'Advanced Inventory & Analytics',
        'Real-time Sales Tracking',
        'Staff Management (up to 20)',
        'Priority Support',
        'PWA Installation',
        'Custom Branding',
        'API Access'
      ],
      popular: true,
      color: 'from-green-50 to-emerald-100'
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For multi-location businesses',
      features: [
        'Unlimited POS Terminals',
        'Multi-location Management',
        'Advanced Analytics & AI Insights',
        'Unlimited Staff Management',
        '24/7 Dedicated Support',
        'PWA Installation',
        'Custom Branding',
        'API Access',
        'White-label Solution',
        'On-site Training'
      ],
      popular: false,
      color: 'from-blue-50 to-indigo-100'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your interest! We will contact you shortly.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/logo.jpg')] opacity-5 bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30">
                <ShoppingCart className="h-16 w-16 text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
              Aveo Cafe' & Lounge
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              Modern Cafe & Restaurant Management System
            </p>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Streamline your business with our powerful POS, admin dashboard, inventory management, and PWA support - all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/30">
                Get Started Free
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all border border-white/30">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features designed specifically for cafes, restaurants, and food service businesses
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-slate-200">
                <div className={`${feature.color} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Flexible pricing to match your business needs. Scale up as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 border-2 transition-all transform hover:-translate-y-2 ${
                  plan.popular
                    ? 'border-green-500 shadow-2xl shadow-green-500/20 bg-gradient-to-br ' + plan.color
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    setFormData({ ...formData, plan: plan.name });
                    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-lg text-slate-600">
              Fill out the form below and our team will contact you within 24 hours
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    placeholder="Your Cafe Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selected Plan
                </label>
                <select
                  required
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white"
                >
                  <option value="">Select a plan</option>
                  <option value="Basic">Basic - $29/month</option>
                  <option value="Professional">Professional - $79/month</option>
                  <option value="Enterprise">Enterprise - $199/month</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold">Aveo Cafe' & Lounge</span>
              </div>
              <p className="text-slate-400 text-sm">
                Modern cafe and restaurant management system for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
                <li>Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Status</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 Aveo Cafe' & Lounge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
