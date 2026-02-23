import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Calendar, Users, CreditCard, TrendingUp, Clock, MessageSquare, Lightbulb, Zap, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency, calculateAge } from '../utils/helpers';
import { APPOINTMENT_TYPES } from '../data/constants';

export default function AIAssistantPage() {
  const { patients, appointments, invoices, getStats, getPatientById, cabinetConfig } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', content: "Bonjour ! 👋 Je suis votre assistant IA MediPlan. Je peux vous aider à:\n\n• Analyser vos rendez-vous\n• Voir les paiements en attente\n• Obtenir des statistiques\n• Vous donner des recommandations\n\nQue puis-je faire pour vous ?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const quickActions = [
    { icon: Calendar, label: "RDV aujourd'hui", query: "Quels sont mes rendez-vous aujourd'hui ?" },
    { icon: Users, label: "Patients récents", query: "Montre-moi les patients récents" },
    { icon: CreditCard, label: "Paiements", query: "Quels paiements sont en attente ?" },
    { icon: TrendingUp, label: "Statistiques", query: "Donne-moi un résumé des statistiques" },
  ];

  const analyzeQuery = (query) => {
    const q = query.toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const stats = getStats();

    // RDV aujourd'hui
    if (q.includes('rendez-vous') && (q.includes('aujourd') || q.includes('today'))) {
      const todayAppts = appointments.filter(a => a.date === today);
      if (todayAppts.length === 0) {
        return "📅 Aucun rendez-vous prévu aujourd'hui. Profitez de cette journée calme ! 🌟";
      }
      let response = `📅 **${todayAppts.length} rendez-vous aujourd'hui:**\n\n`;
      todayAppts.sort((a, b) => a.time.localeCompare(b.time)).forEach(apt => {
        const patient = getPatientById(apt.patientId);
        const typeInfo = APPOINTMENT_TYPES.find(t => t.id === apt.type);
        response += `• **${apt.time}** - ${patient?.firstName} ${patient?.lastName} (${typeInfo?.label || apt.type})\n`;
      });
      return response;
    }

    // Patients récents
    if (q.includes('patient') && (q.includes('récent') || q.includes('nouveau') || q.includes('dernier'))) {
      const recentPatients = [...patients]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      let response = `👥 **${patients.length} patients au total. Voici les 5 plus récents:**\n\n`;
      recentPatients.forEach(p => {
        response += `• **${p.firstName} ${p.lastName}** - ${calculateAge(p.dateOfBirth)} ans, inscrit le ${formatDate(p.createdAt)}\n`;
      });
      return response;
    }

    // Paiements
    if (q.includes('paiement') || q.includes('impayé') || q.includes('attente') || q.includes('facture')) {
      const unpaid = appointments.filter(a => !a.paid && ['termine', 'present'].includes(a.status));
      const totalUnpaid = unpaid.reduce((sum, a) => sum + (a.fee || 0), 0);
      
      if (unpaid.length === 0) {
        return "✅ Excellent ! Tous les paiements sont à jour. Aucune facture en attente.";
      }
      
      let response = `💰 **${unpaid.length} paiements en attente** pour un total de **${formatCurrency(totalUnpaid)}**:\n\n`;
      unpaid.slice(0, 5).forEach(apt => {
        const patient = getPatientById(apt.patientId);
        response += `• ${patient?.firstName} ${patient?.lastName} - ${formatCurrency(apt.fee)} (${formatDate(apt.date)})\n`;
      });
      if (unpaid.length > 5) {
        response += `\n... et ${unpaid.length - 5} autres.\n`;
      }
      response += "\n💡 **Suggestion:** Envoyez des rappels de paiement via SMS ou WhatsApp pour accélérer les encaissements.";
      return response;
    }

    // Statistiques
    if (q.includes('statistique') || q.includes('résumé') || q.includes('bilan') || q.includes('performance')) {
      return `📊 **Résumé de votre cabinet ${cabinetConfig.name}:**\n\n` +
        `• 👥 **${stats.totalPatients}** patients enregistrés\n` +
        `• 📅 **${stats.todayAppointments}** RDV aujourd'hui, **${stats.upcomingAppointments}** à venir\n` +
        `• 💰 Revenus du mois: **${formatCurrency(stats.monthlyRevenue)}**\n` +
        `• ⏳ En attente: **${formatCurrency(stats.pendingPayments)}**\n` +
        `• ✅ Taux de présence: **${100 - parseFloat(stats.absenceRate)}%**\n` +
        `• 🔔 **${stats.remindersSent}** rappels envoyés\n\n` +
        `💡 **Analyse:** ${stats.absenceRate > 10 ? "Le taux d'absence est élevé. Pensez à envoyer des rappels automatiques 24h avant chaque RDV." : "Excellent taux de présence ! Continuez ainsi."}`;
    }

    // Suggestions
    if (q.includes('suggestion') || q.includes('conseil') || q.includes('améliorer') || q.includes('optimiser')) {
      let suggestions = "💡 **Suggestions pour optimiser votre cabinet:**\n\n";
      
      if (stats.absenceRate > 10) {
        suggestions += "🔔 **Rappels automatiques:** Activez les rappels WhatsApp 24h avant chaque RDV pour réduire les absences.\n\n";
      }
      
      if (stats.pendingPayments > 1000) {
        suggestions += "💰 **Paiements:** Vous avez " + formatCurrency(stats.pendingPayments) + " en attente. Configurez les rappels de paiement automatiques.\n\n";
      }
      
      if (patients.length < 50) {
        suggestions += "📈 **Croissance:** Développez votre présence en ligne et demandez des avis à vos patients satisfaits.\n\n";
      }

      suggestions += "⚡ **Automatisation:** Utilisez la facturation automatique après chaque consultation.\n\n";
      suggestions += "📱 **Mobile:** Proposez la prise de RDV en ligne pour simplifier la vie de vos patients.";
      
      return suggestions;
    }

    // Aide
    if (q.includes('aide') || q.includes('help') || q.includes('quoi') || q.includes('faire')) {
      return "🤖 **Je peux vous aider avec:**\n\n" +
        "• **Rendez-vous:** \"Quels sont mes RDV aujourd'hui ?\"\n" +
        "• **Patients:** \"Montre-moi les patients récents\"\n" +
        "• **Paiements:** \"Quels paiements sont en attente ?\"\n" +
        "• **Statistiques:** \"Donne-moi un résumé\"\n" +
        "• **Conseils:** \"Des suggestions pour améliorer ?\"\n\n" +
        "Posez-moi vos questions en langage naturel !";
    }

    // Réponse par défaut
    return "Je n'ai pas bien compris votre demande. 🤔\n\nVous pouvez me demander:\n• Les RDV du jour\n• Les patients récents\n• Les paiements en attente\n• Un résumé statistique\n• Des suggestions d'amélioration";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = { id: Date.now(), type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = analyzeQuery(input);
      const botMessage = { id: Date.now() + 1, type: 'bot', content: response };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickAction = (query) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  const renderMessage = (content) => {
    return content.split('\n').map((line, i) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '&bull; ');
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-violet-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Assistant IA</h1>
          <p className="text-slate-500 text-sm">Analysez vos données avec l'intelligence artificielle</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {quickActions.map((action, i) => (
          <button key={i} onClick={() => handleQuickAction(action.query)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <action.icon size={16} className="text-primary-500" />
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${message.type === 'user' ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                {message.type === 'bot' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-accent-500" />
                    <span className="text-xs font-medium text-accent-600">Assistant IA</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">{renderMessage(message.content)}</div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500">Analyse en cours...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question..."
              className="flex-1 input-field"
            />
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className="btn-primary px-6">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
