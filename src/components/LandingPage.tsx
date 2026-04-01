import { useEffect, useRef, useState } from 'react';
import { 
  Camera, Brain, Cloud, Shield, Zap, 
  ChevronDown, Play, Star, Users, Award, Cpu,
  MapPin, AlertTriangle, Wifi, Eye, Clock, ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for 3D effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animated particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // AI Network nodes
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      connections: number;
    }> = [];

    const nodeCount = 50;
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        connections: Math.floor(Math.random() * 3) + 2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw connections
        nodes.forEach((otherNode, j) => {
          if (i === j) return;
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        // Draw node with glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 2
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "בינה מלאכותית",
      desc: "זיהוי אובייקטים בזמן אמת עם TensorFlow.js",
      color: "from-purple-500 to-pink-500",
      stats: "98% דיוק",
    },
    {
      icon: Cloud,
      title: "ענן מאובטח",
      desc: "גיבוי אוטומטי ל-Supabase עם הצפנה",
      color: "from-blue-500 to-cyan-500",
      stats: "99.9% זמינות",
    },
    {
      icon: Shield,
      title: "אבטחה מתקדמת",
      desc: "הצפנה מקצה לקצה והגנה על פרטיות",
      color: "from-green-500 to-emerald-500",
      stats: "AES-256",
    },
    {
      icon: Zap,
      title: "ביצועים מהירים",
      desc: "React 19 + Vite לחוויה חלקה",
      color: "from-yellow-500 to-orange-500",
      stats: "60 FPS",
    },
  ];

  const stats = [
    { value: "10K+", label: "משתמשים פעילים", icon: Users },
    { value: "50K+", label: "שעות הקלטה", icon: Clock },
    { value: "99.9%", label: "זמינות", icon: Award },
    { value: "4.9", label: "דירוג ממוצע", icon: Star },
  ];

  const techStack = [
    { name: "React 19", icon: "⚛️", desc: "Frontend" },
    { name: "TypeScript", icon: "📘", desc: "Type Safety" },
    { name: "TensorFlow", icon: "🧠", desc: "AI/ML" },
    { name: "Supabase", icon: "🔥", desc: "Backend" },
    { name: "Vite", icon: "⚡", desc: "Build Tool" },
    { name: "Tailwind", icon: "🎨", desc: "Styling" },
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden text-white">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              TravelRecorder AI
            </span>
          </div>
          <button
            onClick={onEnterApp}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold hover:scale-105 transition-transform"
          >
            כניסה לאפליקציה
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        {/* Glowing orbs */}
        <div 
          className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          style={{
            left: `${mousePos.x * 0.02}%`,
            top: `${mousePos.y * 0.02}%`,
            transition: 'left 0.3s ease, top 0.3s ease',
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl right-0 bottom-0"
          style={{
            right: `${mousePos.x * 0.01}%`,
            bottom: `${mousePos.y * 0.01}%`,
            transition: 'right 0.3s ease, bottom 0.3s ease',
          }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-pulse">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400">Powered by AI</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              מצלמת הדרך
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-white/80">
              של העתיד
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            בינה מלאכותית מתקדמת, אחסון ענן מאובטח, וזיהוי תאונות בזמן אמת.
            <br />
            <span className="text-cyan-400">פותחה על ידי AI & Full Stack Developer</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onEnterApp}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold text-lg hover:scale-105 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative flex items-center gap-2">
                <Play className="w-5 h-5" />
                התחל להשתמש
              </span>
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="group px-8 py-4 border border-white/20 rounded-full font-bold text-lg hover:bg-white/5 transition-all flex items-center gap-2"
            >
              גלה עוד
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>

          {/* Stats Preview */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Phone Mockup Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-cyan-400">AI</span> שמגן עליך בדרך
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                המערכת משתמשת ב-TensorFlow.js לזיהוי אובייקטים בזמן אמת - רכבים, הולכי רגל, ומכשולים.
                קבל התראות מיידיות על סכנות פוטנציאליות.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Eye, text: "זיהוי אובייקטים ב-60 FPS" },
                  { icon: AlertTriangle, text: "התראות התנגשות מראש" },
                  { icon: MapPin, text: "מעקב GPS מדויק" },
                  { icon: Cloud, text: "גיבוי אוטומטי לענן" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Mockup */}
            <div className="relative">
              <div 
                className="relative mx-auto w-72 h-[600px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] border-4 border-gray-700 shadow-2xl transform rotate-y-12 hover:rotate-0 transition-transform duration-700"
                style={{
                  transform: `perspective(1000px) rotateY(${(mousePos.x - window.innerWidth / 2) * 0.01}deg) rotateX(${(mousePos.y - window.innerHeight / 2) * -0.01}deg)`,
                }}
              >
                {/* Screen */}
                <div className="absolute inset-4 bg-black rounded-[2.5rem] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs text-gray-400">9:41</div>
                      <div className="flex gap-1">
                        <Wifi className="w-3 h-3 text-gray-400" />
                        <div className="w-5 h-3 border border-gray-400 rounded-sm relative">
                          <div className="absolute inset-0.5 bg-gray-400 w-3/4" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center animate-pulse">
                        <Camera className="w-12 h-12 text-cyan-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-700 rounded-full" />
                      <div className="h-2 bg-gray-700 rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              יכולות <span className="text-cyan-400">מתקדמות</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              טכנולוגיות cutting-edge שמגנות עליך בכל נסיעה
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 hover:border-cyan-500/50 transition-all hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{feature.desc}</p>
                <div className="text-cyan-400 font-mono text-sm">{feature.stats}</div>
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-cyan-400">Full Stack</span> Architecture
            </h2>
            <p className="text-gray-400">הטכנולוגיות שמניעות את המערכת</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all text-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{tech.icon}</div>
                <div className="font-bold text-sm mb-1">{tech.name}</div>
                <div className="text-xs text-gray-500">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-purple-900/20" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-8 h-8 text-cyan-400 ml-1" />
                    </div>
                    <p className="text-gray-400">צפה בהדגמה</p>
                  </div>
                  {/* Overlay UI elements */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">REC</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs">
                    <span className="text-cyan-400">60 FPS</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-black/50 p-3 rounded-lg">
                      <div className="text-xs text-gray-400">מהירות</div>
                      <div className="text-2xl font-bold text-green-400">65 קמ"ש</div>
                    </div>
                    <div className="bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg">
                      <span className="text-red-400 font-bold">⚠️ רכב קדמי</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                ראה את ה-<span className="text-cyan-400">AI</span> בפעולה
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                המערכת מזהה אובייקטים בזמן אמת, מודדת מרחקים, ומזהירה על סכנות פוטנציאליות לפני שקורה משהו.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onEnterApp}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  התנסה בעצמך
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-purple-900/40" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            מוכן להתחיל?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            הצטרף לאלפי משתמשים שכבר נהנים מהגנה מתקדמת בדרכים
          </p>
          <button
            onClick={onEnterApp}
            className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
          >
            כניסה לאפליקציה
          </button>
          <p className="mt-6 text-sm text-gray-500">
            100% חינמי • אין צורך בכרטיס אשראי • פרטיות מובטחת
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">TravelRecorder AI</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>© 2024</span>
              <span>פותח על ידי AI & Full Stack Developer</span>
              <a href="https://github.com/jelyashar-web/travel-recorder" className="hover:text-cyan-400 transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
