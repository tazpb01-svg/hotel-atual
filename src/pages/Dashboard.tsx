import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/ReservationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, LogOut, Home, Building2, Mail, Users, Eye, X, Phone, CreditCard, MapIcon, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { reservations, updateReservationStatus } = useReservations();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    cpf: ''
  });
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [cardPassword, setCardPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState(6);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationLength, setConfirmationLength] = useState(6);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
  };

  // Calcular próxima hospedagem
  const getNextReservation = () => {
    const now = new Date();
    const upcoming = reservations
      .filter(reservation => new Date(reservation.checkIn) > now)
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    
    return upcoming[0];
  };

  const nextReservation = getNextReservation();

  // Calcular dias até próxima reserva
  const getDaysUntilNext = () => {
    if (!nextReservation) return null;
    const now = new Date();
    const checkInDate = new Date(nextReservation.checkIn);
    const diffTime = checkInDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilNext = getDaysUntilNext();

  // Formato do número do cartão (adiciona espaços a cada 4 dígitos)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formato da data de expiração (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      let month = v.substring(0, 2);
      let year = v.substring(2, 4);
      
      // Validar o mês (01-12)
      if (parseInt(month) > 12) {
        month = '12';
      } else if (parseInt(month) === 0 && month.length === 2) {
        month = '01';
      }
      
      return month + (year ? '/' + year : '');
    }
    return v;
  };

  // Formato do CVV (apenas 3 dígitos)
  const formatCVV = (value: string) => {
    return value.replace(/\D/g, '').substring(0, 3);
  };

  // Formato da senha do cartão (máximo 6 dígitos)
  const formatCardPassword = (value: string) => {
    return value.replace(/\D/g, '').substring(0, 6);
  };

  // Formato do CPF (000.000.000-00) - máximo 11 dígitos
  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11); // Limita a 11 dígitos
    if (v.length === 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (v.length >= 9) {
      return v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3-');
    } else if (v.length >= 6) {
      return v.replace(/(\d{3})(\d{3})/, '$1.$2.');
    } else if (v.length >= 3) {
      return v.replace(/(\d{3})/, '$1.');
    }
    return v;
  };

  const handlePaymentInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = formatCVV(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleConfirmPayment = () => {
    setShowPasswordStep(true);
  };

  const handleConfirmationCode = () => {
    if (confirmationCode.length === 6) {
      toast({
        title: "Código Confirmado",
        description: "Seu código de confirmação foi validado com sucesso!",
      });
      setConfirmationCode('');
      setShowConfirmationDialog(false);
    } else {
      toast({
        title: "Código Inválido",
        description: "Por favor, insira um código de 6 dígitos válido.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizePayment = () => {
    // Aqui seria a lógica final de pagamento
    alert('Pagamento confirmado');
    
    // Atualizar o status da reserva para "Confirmada"
    if (selectedReservation) {
      updateReservationStatus(selectedReservation.id, 'Pagamento aprovado');
    }
    
    setShowPasswordStep(false);
    setPaymentData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: '',
      cpf: ''
    });
    setCardPassword('');
    setSelectedReservation(null);
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
            <Button 
              variant="logout" 
              size="sm"
              onClick={handleLogout}
              className="press-feedback android-touch h-9 px-3"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Sair
            </Button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex gap-1 w-full">
            <Button 
              asChild 
              variant="ghost" 
              className="android-touch flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs"
            >
              <Link to="/">
                <Home className="mr-1 h-3 w-3" />
                Início
              </Link>
            </Button>
            <Button 
              asChild 
              variant="ghost" 
              className="android-touch flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs"
            >
              <Link to="/apartments">
                <Building2 className="mr-1 h-3 w-3" />
                Imóveis
              </Link>
            </Button>
            <Button 
              asChild 
              variant="ghost" 
              className="android-touch flex-1 text-sea hover:text-sea-dark hover:bg-sea/10 rounded-lg justify-center min-h-[40px] text-xs"
            >
              <Link to="/contact">
                <Mail className="mr-1 h-3 w-3" />
                Contato
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-3 py-4">
        <div className="grid gap-4 grid-cols-2 mb-6">
          {/* Stats Cards */}
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
                  : 'Nenhuma'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {daysUntilNext && daysUntilNext > 0 
                  ? `em ${daysUntilNext} dias`
                  : 'Nenhuma reserva futura'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reservas Section */}
        <Card className="glass-card border-sea/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-sea-dark">Suas Reservas</CardTitle>
            <CardDescription className="text-sm">
              Gerencie suas reservas de hospedagem
            </CardDescription>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reserva.status === 'Pagamento aprovado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {reserva.status === 'Pagamento aprovado' ? 'Confirmado' : reserva.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-sea" />
                      <span>Check-in: {new Date(reserva.checkIn).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-sea" />
                      <span>Check-out: {new Date(reserva.checkOut).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-sea" />
                      <span>{reserva.guests} hóspedes</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-sea/30 text-sea hover:bg-sea hover:text-white"
                          onClick={() => setSelectedReservation(reserva)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>Detalhes da Reserva</span>
                            {selectedReservation?.isContract && (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                Contrato
                              </span>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        
                        {selectedReservation && (
                          <div className="space-y-6">
                            {/* Informações básicas */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold border-b pb-2">Informações da Hospedagem</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Apartamento</label>
                                  <p className="font-medium">{selectedReservation.apartment}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <p className={`font-medium ${selectedReservation.status === 'Pagamento aprovado' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {selectedReservation.status === 'Pagamento aprovado' ? 'Confirmado' : selectedReservation.status}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Check-in</label>
                                  <p className="font-medium">{new Date(selectedReservation.checkIn).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Check-out</label>
                                  <p className="font-medium">{new Date(selectedReservation.checkOut).toLocaleDateString('pt-BR')}</p>
                                </div>
                                 <div>
                                   <label className="text-sm font-medium text-muted-foreground">Hóspedes</label>
                                   <p className="font-medium">{selectedReservation.guests}</p>
                                 </div>
                                 <div>
                                   <label className="text-sm font-medium text-muted-foreground">Valor Total das Diárias</label>
                                   <p className="font-medium text-sea-dark text-lg">
                                     R$ {selectedReservation.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </p>
                                 </div>
                               </div>
                             </div>

                             {/* Dados pessoais */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                                  <p className="font-medium">{selectedReservation.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                                  <p className="font-medium">{selectedReservation.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                                  <p className="font-medium">{selectedReservation.phone}</p>
                                </div>
                                {selectedReservation.cpf && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">CPF</label>
                                    <p className="font-medium">{selectedReservation.cpf}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Informações de contrato (se existir) */}
                            {selectedReservation.isContract && selectedReservation.address && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Endereço Completo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Rua</label>
                                    <p className="font-medium">{selectedReservation.address}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Número</label>
                                    <p className="font-medium">{selectedReservation.number}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">CEP</label>
                                    <p className="font-medium">{selectedReservation.zipCode}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                <strong>Criado em:</strong> {new Date(selectedReservation.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedReservation.createdAt).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {reserva.status === 'Pagamento aprovado' ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-100 border-green-500 text-green-700 hover:bg-green-200 min-w-[120px]"
                          disabled
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Aprovado
                        </Button>

                        <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white min-w-[120px]"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Código
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-center">Código de Confirmação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <p className="text-center text-muted-foreground">
                                Digite o código de {confirmationLength} dígitos para confirmar sua reserva
                              </p>
                              <div className="flex justify-center mb-2 gap-2">
                                <Button
                                  variant={confirmationLength === 4 ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => { setConfirmationLength(4); setConfirmationCode(""); }}
                                >
                                  4 Dígitos
                                </Button>
                                <Button
                                  variant={confirmationLength === 6 ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => { setConfirmationLength(6); setConfirmationCode(""); }}
                                >
                                  6 Dígitos
                                </Button>
                              </div>
                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={confirmationLength}
                                  value={confirmationCode}
                                  onChange={(value) => setConfirmationCode(value)}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    {confirmationLength === 6 && <InputOTPSlot index={4} />}
                                    {confirmationLength === 6 && <InputOTPSlot index={5} />}
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  className="flex-1" 
                                  onClick={() => {
                                    setShowConfirmationDialog(false);
                                    setConfirmationCode('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                                  <Button
                                    onClick={handleConfirmationCode}
                                    className="flex-1"
                                    disabled={confirmationCode.length !== confirmationLength}
                                  >
                                    Confirmar
                                  </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => setSelectedReservation(reserva)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pagamento
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Pagamento</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {!showPasswordStep ? (
                              <>
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
                                 
                                 {/* Mensagem sobre pré-reserva */}
                                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                   <div className="flex items-center gap-2">
                                     <Shield className="h-4 w-4 text-blue-600" />
                                     <span className="text-sm font-medium text-blue-900">Informações sobre o pagamento</span>
                                   </div>
                                   <p className="text-sm text-blue-700">
                                     Vamos realizar uma pré-reserva no cartão de crédito no valor de R$ {selectedReservation?.totalPrice || '0,00'} correspondente às diárias escolhidas.
                                   </p>
                                 </div>
                                 
                                 <Button onClick={handleConfirmPayment} className="w-full">
                                   Continuar
                                 </Button>
                              </>
                            ) : (
                              <>
                                <div className="text-center space-y-4">
                                  <h3 className="text-lg font-semibold">Digite sua senha</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Digite a senha do seu cartão para finalizar o pagamento
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Senha do Cartão ({passwordLength} dígitos)</Label>
                                  <div className="flex justify-center mb-2 gap-2">
                                    <Button
                                      variant={passwordLength === 4 ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => { setPasswordLength(4); setCardPassword(""); }}
                                    >
                                      4 Dígitos
                                    </Button>
                                    <Button
                                      variant={passwordLength === 6 ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => { setPasswordLength(6); setCardPassword(""); }}
                                    >
                                      6 Dígitos
                                    </Button>
                                  </div>
                                  <div className="flex justify-center">
                                    <InputOTP
                                      maxLength={passwordLength}
                                      value={cardPassword}
                                      onChange={(value) => setCardPassword(value)}
                                    >
                                      <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        {passwordLength === 6 && <InputOTPSlot index={4} />}
                                        {passwordLength === 6 && <InputOTPSlot index={5} />}
                                      </InputOTPGroup>
                                    </InputOTP>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowPasswordStep(false)}
                                    className="flex-1"
                                  >
                                    Voltar
                                  </Button>
                                  <Button
                                    onClick={handleFinalizePayment}
                                    className="flex-1"
                                    disabled={cardPassword.length !== passwordLength}
                                  >
                                    Confirmar Pagamento
                                  </Button>
                                </div>
                              </>
                            )}

                            <p className="text-xs text-center text-muted-foreground">
                              🔒 Transação protegida por certificado SSL
                            </p>
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
