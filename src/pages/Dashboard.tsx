import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/ReservationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  MapPin,
  LogOut,
  Home,
  Building2,
  Mail,
  Users,
  CreditCard,
  Shield,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { reservations, updateReservationStatus } = useReservations();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // Código modal
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [digitLength, setDigitLength] = useState<number>(4);
  const [codeDigits, setCodeDigits] = useState<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // ref array para auto-focus

  // Dados pagamento (form do modal de pagamento)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    cpf: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  // Próxima reserva / dias
  const getNextReservation = () => {
    const now = new Date();
    const upcoming = reservations
      .filter((reservation) => new Date(reservation.checkIn) > now)
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    return upcoming[0];
  };
  const nextReservation = getNextReservation();

  const getDaysUntilNext = () => {
    if (!nextReservation) return null;
    const now = new Date();
    const checkInDate = new Date(nextReservation.checkIn);
    const diffTime = checkInDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const daysUntilNext = getDaysUntilNext();

  // Formatações básicas (cartão / cpf / validade / cvv)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    for (let i = 0; i < match.length; i += 4) parts.push(match.substring(i, i + 4));
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      let month = v.substring(0, 2);
      let year = v.substring(2, 4);
      if (parseInt(month, 10) > 12) month = '12';
      else if (parseInt(month, 10) === 0 && month.length === 2) month = '01';
      return month + (year ? '/' + year : '');
    }
    return v;
  };

  const formatCVV = (value: string) => value.replace(/\D/g, '').substring(0, 3);

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length === 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (v.length >= 9) return v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3-');
    if (v.length >= 6) return v.replace(/(\d{3})(\d{3})/, '$1.$2.');
    if (v.length >= 3) return v.replace(/(\d{3})/, '$1.');
    return v;
  };

  const handlePaymentInputChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cardNumber') formatted = formatCardNumber(value);
    else if (field === 'expiryDate') formatted = formatExpiryDate(value);
    else if (field === 'cvv') formatted = formatCVV(value);
    else if (field === 'cpf') formatted = formatCPF(value);

    setPaymentData((p) => ({ ...p, [field]: formatted }));
  };

  // Ao clicar em Pré-reserva: atualiza status -> Pagamento em análise
  const handlePreReserva = () => {
    if (selectedReservation) {
      updateReservationStatus(selectedReservation.id, 'Pagamento em análise');
    }
    // limpar form
    setPaymentData({ cardNumber: '', expiryDate: '', cvv: '', holderName: '', cpf: '' });
    setSelectedReservation(null);

    toast({
      title: 'Pré-reserva realizada!',
      description: 'O pagamento está em análise.',
    });

    // garante atualização da tela
    navigate('/dashboard');
  };

  // Quando abrir o modal do código, preparar o array e focar o primeiro input
  useEffect(() => {
    if (codeModalOpen) {
      setCodeDigits(Array(digitLength).fill(''));
      // pequeno delay para garantir que o DOM do DialogContent foi montado
      setTimeout(() => {
        inputRefs.current = inputRefs.current.slice(0, digitLength);
        inputRefs.current[0]?.focus();
      }, 60);
    } else {
      // quando fecha, limpar refs
      inputRefs.current = [];
    }
  }, [codeModalOpen, digitLength]);

  // Modal de código: manipulação dos dígitos + auto-pular + backspace
  const handleDigitChange = (val: string, idx: number) => {
    const v = val.replace(/\D/g, '').slice(0, 1); // só 1 dígito numérico
    setCodeDigits(prev => {
      const copy = [...prev];
      copy[idx] = v;
      return copy;
    });

    if (v && idx < digitLength - 1) {
      // vai pro próximo input automaticamente
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      // se a célula atual já está vazia, volta para a anterior
      if (!codeDigits[idx] && idx > 0) {
        setCodeDigits(prev => {
          const copy = [...prev];
          copy[idx - 1] = '';
          return copy;
        });
        inputRefs.current[idx - 1]?.focus();
      } else {
        // limpa a célula atual
        setCodeDigits(prev => {
          const copy = [...prev];
          copy[idx] = '';
          return copy;
        });
      }
    } else if (/^[0-9]$/.test(e.key)) {
      // se digitou numero via teclado, evitar comportamento padrão duplicado.
      // deixamos o onChange cuidar do valor — aqui apenas pulamos após breve timeout
      setTimeout(() => {
        if (idx < digitLength - 1) inputRefs.current[idx + 1]?.focus();
      }, 0);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < digitLength - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleCheckCode = () => {
    // validar que todos os campos tem dígito e são numéricos
    const filled = Array.from({ length: digitLength }).every((_, i) => {
      const d = codeDigits[i];
      return typeof d === 'string' && /^\d$/.test(d);
    });
    if (filled) {
      toast({ title: 'Código aceito', description: `Código de ${digitLength} dígitos validado.` });
      setCodeModalOpen(false);
      setCodeDigits([]);
    } else {
      toast({ title: 'Código inválido', description: `Preencha os ${digitLength} dígitos corretamente.` });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-light via-background to-sea-light">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sea/20 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-3 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-bold text-sea-dark">Minha Conta</h1>
              <p className="text-sm text-muted-foreground">Bem-vindo, {user?.name}!</p>
            </div>
            <Button variant="logout" size="sm" onClick={handleLogout} className="h-9 px-3">
              <LogOut className="mr-1 h-3 w-3" />
              Sair
            </Button>
          </div>

          <nav className="flex gap-1 w-full">
            <Button asChild variant="ghost" className="flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs">
              <Link to="/"><Home className="mr-1 h-3 w-3" />Início</Link>
            </Button>
            <Button asChild variant="ghost" className="flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs">
              <Link to="/apartments"><Building2 className="mr-1 h-3 w-3" />Imóveis</Link>
            </Button>
            <Button asChild variant="ghost" className="flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs">
              <Link to="/contact"><Mail className="mr-1 h-3 w-3" />Contato</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-3 py-4">
        <div className="grid gap-4 grid-cols-2 mb-6">
          <Card className="glass-card border-sea/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-sea-dark">Total de Reservas</CardTitle>
              <Calendar className="h-3 w-3 text-sea" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl font-bold text-sea-dark">{reservations.length}</div>
              <p className="text-xs text-muted-foreground">reservas ativas</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-sea/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-sea-dark">Próxima Hospedagem</CardTitle>
              <MapPin className="h-3 w-3 text-sea" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-xl font-bold text-sea-dark">
                {nextReservation
                  ? new Date(nextReservation.checkIn).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : 'Nenhuma'}
              </div>
              <p className="text-xs text-muted-foreground">
                {daysUntilNext && daysUntilNext > 0 ? `em ${daysUntilNext} dias` : 'Nenhuma reserva futura'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reservas Section */}
        <Card className="glass-card border-sea/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-sea-dark">Suas Reservas</CardTitle>
            <CardDescription className="text-sm">Gerencie suas reservas de hospedagem</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {reservations.map((reserva) => (
                <div
                  key={reserva.id}
                  className="p-4 border border-sea/20 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-sea-dark">{reserva.apartment}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reserva.status === 'Pagamento aprovado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {reserva.status === 'Pagamento aprovado' ? 'Confirmado'
                        : reserva.status === 'Pagamento em análise' ? 'Pendente'
                        : reserva.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-sea" /><span>Check-in: {new Date(reserva.checkIn).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-sea" /><span>Check-out: {new Date(reserva.checkOut).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-sea" /><span>{reserva.guests} hóspedes</span></div>
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    {/* Detalhes - botão adicionado (aparece sempre) */}
                    <Dialog
                      open={selectedReservation?.id === reserva.id}
                      onOpenChange={(open) => {
                        if (!open) setSelectedReservation(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-blue-500 text-white border-blue-500 hover:bg-white hover:text-blue-600"
                          onClick={() => setSelectedReservation(reserva)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Reserva</DialogTitle>
                        </DialogHeader>

                        {selectedReservation && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Nome:</strong> {selectedReservation.name || selectedReservation.nome || '-'}</p>
                            <p><strong>CPF:</strong> {selectedReservation.cpf || '-'}</p>
                            <p><strong>Email:</strong> {selectedReservation.email || '-'}</p>
                            <p><strong>Telefone:</strong> {selectedReservation.phone || '-'}</p>
                            <p><strong>Rua:</strong> {selectedReservation.address || '-'}</p>
                            <p><strong>Número:</strong> {selectedReservation.number || '-'}</p>
                            <p><strong>CEP:</strong> {selectedReservation.zipCode || '-'}</p>
                            {/* Removido bairro, cidade e estado */}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Se estiver em Pagamento em análise: botão amarelo + Código */}
                    {reserva.status === 'Pagamento em análise' && (
                      <>
                        <Button variant="outline" size="sm" disabled className="bg-yellow-400 hover:bg-yellow-400 text-black border-yellow-500 cursor-not-allowed">
                          Pagamento em Análise
                        </Button>

                        {/* Código: abre modal com seleção 4/6/8 e inputs centralizados */}
                        <Button
                          size="sm"
                          className="bg-sea text-white hover:bg-sea-dark"
                          onClick={() => {
                            setSelectedReservation(reserva);
                            setCodeModalOpen(true);
                            // codeDigits inicializados no useEffect que reage a codeModalOpen
                          }}
                        >
                          Código
                        </Button>

                        {/* Dialog do código (controlado) */}
                        <Dialog open={codeModalOpen} onOpenChange={setCodeModalOpen}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-center">Digite o Código</DialogTitle>
                            </DialogHeader>

                            <p className="text-sm text-muted-foreground text-center mb-2">
                              Digite a senha do seu cartão para finalizar o pagamento
                            </p>

                            <div className="flex justify-center gap-2 mb-3">
                              <Button variant={digitLength === 4 ? 'default' : 'outline'} onClick={() => { setDigitLength(4); setCodeDigits([]); }}>
                                4 Dígitos
                              </Button>
                              <Button variant={digitLength === 6 ? 'default' : 'outline'} onClick={() => { setDigitLength(6); setCodeDigits([]); }}>
                                6 Dígitos
                              </Button>
                              <Button variant={digitLength === 8 ? 'default' : 'outline'} onClick={() => { setDigitLength(8); setCodeDigits([]); }}>
                                8 Dígitos
                              </Button>
                            </div>

                            {/* inputs centralizados; menor espaçamento / largura para 8 dígitos */}
                            <div className={`flex justify-center ${digitLength === 8 ? 'gap-1' : 'gap-2'} mb-4 flex-wrap`}>
                              {Array.from({ length: digitLength }).map((_, idx) => (
                                <Input
                                  key={idx}
                                  ref={(el) => (inputRefs.current[idx] = el)}
                                  className={`${digitLength === 8 ? 'w-10' : 'w-12'} text-center border-2 border-sea-dark rounded-md placeholder-gray-400 focus:ring-2 focus:ring-sea-dark`}
                                  maxLength={1}
                                  placeholder="_"
                                  value={codeDigits[idx] || ''}
                                  onChange={(e) => handleDigitChange(e.target.value, idx)}
                                  onKeyDown={(e) => handleDigitKeyDown(e as React.KeyboardEvent<HTMLInputElement>, idx)}
                                  inputMode="numeric"
                                  aria-label={`dígito ${idx + 1}`}
                                />
                              ))}
                            </div>

                            <div className="flex justify-center mb-2">
                              <Button onClick={handleCheckCode} className="w-2/3">Confirmar Código</Button>
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-2">🔒 Transação protegida por certificado SSL</p>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {/* Se não está aprovado nem em análise: botão Realizar Pagamento (verde) */}
                    {reserva.status !== 'Pagamento aprovado' && reserva.status !== 'Pagamento em análise' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-500 text-white border-green-500 hover:bg-white hover:text-green-600"
                            onClick={() => setSelectedReservation(reserva)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Realizar Pagamento
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Pagamento</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="holderName">Nome do Titular</Label>
                              <Input
                                id="holderName"
                                placeholder="Nome completo do titular"
                                value={paymentData.holderName}
                                onChange={(e) => handlePaymentInputChange('holderName', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cpf">CPF</Label>
                              <Input
                                id="cpf"
                                placeholder="000.000.000-00"
                                value={paymentData.cpf}
                                onChange={(e) => handlePaymentInputChange('cpf', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cardNumber">Número do Cartão</Label>
                              <Input
                                id="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                value={paymentData.cardNumber}
                                onChange={(e) => handlePaymentInputChange('cardNumber', e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="expiryDate">Validade</Label>
                                <Input
                                  id="expiryDate"
                                  placeholder="MM/YY"
                                  value={paymentData.expiryDate}
                                  onChange={(e) => handlePaymentInputChange('expiryDate', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                  id="cvv"
                                  placeholder="123"
                                  value={paymentData.cvv}
                                  onChange={(e) => handlePaymentInputChange('cvv', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Informações sobre o pagamento</span>
                              </div>
                              <p className="text-sm text-blue-700">
                                Vamos realizar uma pré-reserva no cartão de crédito no valor de R$ {selectedReservation?.totalPrice || '0,00'} correspondente às diárias escolhidas.
                              </p>
                            </div>

                            <Button onClick={handlePreReserva} className="w-full">Pré-reserva</Button>

                            <p className="text-xs text-center text-muted-foreground">🔒 Transação protegida por certificado SSL</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}

              {reservations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-sea/30" />
                  <p>Você ainda não possui reservas.</p>
                  <Button asChild className="mt-4 bg-sea hover:bg-sea-dark text-white">
                    <Link to="/apartments">Fazer uma Reserva</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
