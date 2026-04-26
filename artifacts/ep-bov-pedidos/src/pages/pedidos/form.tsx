import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetOrder, 
  useCreateOrder, 
  useUpdateOrder, 
  useListCustomers,
  getListOrdersQueryKey,
  getGetOrderQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, Send } from "lucide-react";
import { Link } from "wouter";
import { parseFormattedNumber, formatCurrency } from "@/lib/format";
import { generateOrderPDF, shareOrderPDFViaWhatsApp } from "@/lib/pdf-generator";

const orderItemSchema = z.object({
  especie: z.string().min(1, "Obrigatório"),
  raca: z.string().min(1, "Obrigatório"),
  idade: z.string().min(1, "Obrigatório"),
  quantidade: z.number().min(1, "Obrigatório"),
  peso: z.number().min(0.1, "Obrigatório"),
  precoArroba: z.number().min(0.1, "Obrigatório"),
  rastreabilidade: z.boolean().default(false),
});

const orderSchema = z.object({
  compradorId: z.number({ required_error: "Selecione o comprador" }).min(1, "Selecione o comprador"),
  vendedorId: z.number({ required_error: "Selecione o vendedor" }).min(1, "Selecione o vendedor"),
  dataEmbarque: z.string().nullable().optional(),
  dataDesembarque: z.string().nullable().optional(),
  dataAbate: z.string().nullable().optional(),
  roteiro: z.string().nullable().optional(),
  formaPagamento: z.string().min(1, "Obrigatório"),
  prazoPagamento: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  dataCompra: z.string().nullable().optional(),
  assinaturaComprador: z.string().nullable().optional(),
  assinaturaVendedor: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um item"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const ESPECIES = ["Boi para Abate", "Vaca para Abate", "Novilha para Abate", "Bezerros", "Bezerras", "Novilha", "Garrote", "Vacas", "Touro"];
const RACAS = ["Nelore", "Angus", "Anelorado", "Cruzado"];
const IDADES = ["0 a 4", "5 a 12", "13 a 24", "25 a 36", "+36"];
const FORMAS_PAGAMENTO = ["À VISTA", "A PRAZO"];
const PRAZOS = ["7 dias", "15 dias", "30 dias", "45 dias", "60 dias", "30/60/90 dias"];

export default function PedidoForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!params.id && params.id !== "novo";
  const orderId = isEditing ? parseInt(params.id as string) : 0;

  const { data: order, isLoading: isLoadingOrder } = useGetOrder(orderId, {
    query: { enabled: isEditing, queryKey: getGetOrderQueryKey(orderId) }
  });

  const { data: customers } = useListCustomers();
  
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [currentPdfFileName, setCurrentPdfFileName] = useState<string>("");
  const [savedOrderForPdf, setSavedOrderForPdf] = useState<any>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      compradorId: undefined,
      vendedorId: undefined,
      dataEmbarque: "",
      dataDesembarque: "",
      dataAbate: "",
      roteiro: "",
      formaPagamento: "",
      prazoPagamento: "",
      observacao: "",
      dataCompra: new Date().toISOString().split('T')[0],
      assinaturaComprador: "",
      assinaturaVendedor: "",
      items: [{
        especie: "",
        raca: "",
        idade: "",
        quantidade: 0,
        peso: 0,
        precoArroba: 0,
        rastreabilidade: false
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const compradorId = form.watch("compradorId");
  const vendedorId = form.watch("vendedorId");
  const formaPagamento = form.watch("formaPagamento");
  const items = form.watch("items");

  const compradorSelecionado = customers?.find(c => c.id === compradorId);
  const vendedorSelecionado = customers?.find(c => c.id === vendedorId);

  useEffect(() => {
    if (order && isEditing) {
      form.reset({
        compradorId: order.compradorId,
        vendedorId: order.vendedorId,
        dataEmbarque: order.dataEmbarque || "",
        dataDesembarque: order.dataDesembarque || "",
        dataAbate: order.dataAbate || "",
        roteiro: order.roteiro || "",
        formaPagamento: order.formaPagamento || "",
        prazoPagamento: order.prazoPagamento || "",
        observacao: order.observacao || "",
        dataCompra: order.dataCompra ? order.dataCompra.split('T')[0] : "",
        assinaturaComprador: order.assinaturaComprador || "",
        assinaturaVendedor: order.assinaturaVendedor || "",
        items: order.items.map(i => ({
          especie: i.especie,
          raca: i.raca,
          idade: i.idade,
          quantidade: i.quantidade,
          peso: i.peso,
          precoArroba: i.precoArroba,
          rastreabilidade: i.rastreabilidade
        })),
      });
      
      setSavedOrderForPdf(order);
    }
  }, [order, isEditing, form]);

  useEffect(() => {
    if (!isEditing && vendedorSelecionado?.roteiro && !form.getValues("roteiro")) {
      form.setValue("roteiro", vendedorSelecionado.roteiro);
    }
  }, [vendedorSelecionado, isEditing, form]);

  const totalQtd = items.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
  const totalPeso = items.reduce((acc, item) => acc + ((Number(item.quantidade) || 0) * (Number(item.peso) || 0)), 0);
  const totalValor = items.reduce((acc, item) => acc + ((Number(item.quantidade) || 0) * (Number(item.peso) || 0) * (Number(item.precoArroba) || 0)), 0);

  const handleSave = (data: OrderFormValues, status: string, showPdf: boolean = false) => {
    const payload = {
      ...data,
      status
    };

    if (isEditing) {
      updateOrder.mutate({ id: orderId, data: payload }, {
        onSuccess: (updatedOrder) => {
          toast({ title: `Pedido ${status === 'rascunho' ? 'salvo como rascunho' : 'emitido'} com sucesso!` });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          
          setSavedOrderForPdf(updatedOrder);
          
          if (showPdf) {
            handleGeneratePdf(updatedOrder);
          } else {
            setLocation("/pedidos");
          }
        },
        onError: () => {
          toast({ title: "Erro ao salvar pedido", variant: "destructive" });
        }
      });
    } else {
      createOrder.mutate({ data: payload }, {
        onSuccess: (newOrder) => {
          toast({ title: `Pedido ${status === 'rascunho' ? 'salvo como rascunho' : 'emitido'} com sucesso!` });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          
          setSavedOrderForPdf(newOrder);
          
          if (showPdf) {
            handleGeneratePdf(newOrder);
            // Replace url to edit mode
            window.history.replaceState({}, '', `/pedidos/${newOrder.id}/editar`);
          } else {
            setLocation("/pedidos");
          }
        },
        onError: () => {
          toast({ title: "Erro ao criar pedido", variant: "destructive" });
        }
      });
    }
  };

  const handleGeneratePdf = (orderData: any) => {
    if (!orderData) return;
    
    try {
      const comp = customers?.find(c => c.id === orderData.compradorId);
      const vend = customers?.find(c => c.id === orderData.vendedorId);
      
      const { blob, fileName } = generateOrderPDF(orderData, comp, vend);
      setPdfBlobUrl(blob);
      setCurrentPdfFileName(fileName);
      setIsPdfDialogOpen(true);
    } catch (e) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
      console.error(e);
    }
  };

  const handleWhatsApp = async (orderData: any) => {
    if (!orderData) return;

    const comp = customers?.find(c => c.id === orderData.compradorId);
    const vend = customers?.find(c => c.id === orderData.vendedorId);

    try {
      const result = await shareOrderPDFViaWhatsApp(orderData, comp, vend);
      if (result === "downloaded-fallback") {
        toast({
          title: "PDF baixado",
          description: "Anexe o arquivo PDF baixado na conversa do WhatsApp.",
        });
      }
    } catch (e) {
      toast({ title: "Erro ao compartilhar pelo WhatsApp", variant: "destructive" });
      console.error(e);
    }
  };

  const isSaving = createOrder.isPending || updateOrder.isPending;

  if (isEditing && isLoadingOrder) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/pedidos">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? `Pedido ${order?.numero || ''}` : "Novo Pedido de Compra"}
            </h1>
            <p className="text-muted-foreground mt-1">Preencha as informações da negociação.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {savedOrderForPdf && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleGeneratePdf(savedOrderForPdf)}>
                <FileText className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleWhatsApp(savedOrderForPdf)}>
                <Send className="h-4 w-4 mr-2" /> WhatsApp
              </Button>
            </>
          )}
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          
          {/* Cabeçalho */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-primary">EP COMERCIO DE BOVINOS</h2>
                  <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-1">
                    <span>CNPJ: 63.078.738/0001-91</span>
                    <span>Telefone: (66) 99631-9292</span>
                    <span className="sm:col-span-2">Endereço: Al. Das Rosas, 2500, Vila Aurora – Rondonópolis-MT</span>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right bg-card p-4 rounded-lg border shadow-sm min-w-[200px]">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Nº DO PEDIDO</div>
                <div className="text-3xl font-bold text-foreground">
                  {order?.numero || <span className="text-muted-foreground/50">NOVO</span>}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Emissão: {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cronograma */}
          <Card>
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="text-lg">Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="dataEmbarque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Embarque</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataDesembarque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Desembarque</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataAbate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Abate</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Comprador / Vendedor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comprador */}
            <Card>
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Comprador</CardTitle>
                  <Link href="/clientes/novo" target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary">
                      <Plus className="h-3 w-3" /> Novo
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="compradorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Comprador *</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {compradorSelecionado && (
                  <div className="bg-muted/30 p-4 rounded-md space-y-2 text-sm border">
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Nome:</span>
                      <span className="font-medium">{compradorSelecionado.nome}</span>
                    </div>
                    {compradorSelecionado.fazenda && (
                      <div className="grid grid-cols-[100px_1fr] gap-1">
                        <span className="text-muted-foreground font-medium">Fazenda:</span>
                        <span>{compradorSelecionado.fazenda}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">CPF/CNPJ:</span>
                      <span>{compradorSelecionado.cpfCnpj || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Endereço:</span>
                      <span>{compradorSelecionado.endereco || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Cidade/UF:</span>
                      <span>{compradorSelecionado.municipio || '-'}/{compradorSelecionado.uf || '-'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendedor */}
            <Card>
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Vendedor</CardTitle>
                  <Link href="/clientes/novo" target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary">
                      <Plus className="h-3 w-3" /> Novo
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="vendedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Vendedor *</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {vendedorSelecionado && (
                  <div className="bg-muted/30 p-4 rounded-md space-y-2 text-sm border">
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Nome:</span>
                      <span className="font-medium">{vendedorSelecionado.nome}</span>
                    </div>
                    {vendedorSelecionado.fazenda && (
                      <div className="grid grid-cols-[100px_1fr] gap-1">
                        <span className="text-muted-foreground font-medium">Fazenda:</span>
                        <span>{vendedorSelecionado.fazenda}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">CPF/CNPJ:</span>
                      <span>{vendedorSelecionado.cpfCnpj || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Endereço:</span>
                      <span>{vendedorSelecionado.endereco || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground font-medium">Cidade/UF:</span>
                      <span>{vendedorSelecionado.municipio || '-'}/{vendedorSelecionado.uf || '-'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="text-lg">Roteiro e Transporte</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="roteiro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes do Roteiro</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} className="min-h-[80px]" placeholder="Instruções de transporte, rotas e paradas..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Tabela de Preços */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-card pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                  <CardDescription>Adicione os animais negociados.</CardDescription>
                </div>
                <Button 
                  type="button" 
                  onClick={() => append({ especie: "", raca: "", idade: "", quantidade: 0, peso: 0, precoArroba: 0, rastreabilidade: false })}
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[180px]">Espécie *</TableHead>
                      <TableHead className="w-[140px]">Raça *</TableHead>
                      <TableHead className="w-[120px]">Idade *</TableHead>
                      <TableHead className="w-[100px]">Qtd *</TableHead>
                      <TableHead className="w-[120px]">Peso (@) *</TableHead>
                      <TableHead className="w-[140px]">Preço/@ (R$) *</TableHead>
                      <TableHead className="w-[120px]">Total</TableHead>
                      <TableHead className="w-[80px] text-center">Rastr.</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="group">
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.especie`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Espécie" /></SelectTrigger></FormControl>
                                  <SelectContent>{ESPECIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.raca`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Raça" /></SelectTrigger></FormControl>
                                  <SelectContent>{RACAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.idade`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Idade" /></SelectTrigger></FormControl>
                                  <SelectContent>{IDADES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantidade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="text" className="h-9 text-right" 
                                    value={field.value || ""} 
                                    onChange={e => field.onChange(parseFormattedNumber(e.target.value))} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.peso`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="text" className="h-9 text-right" 
                                    value={field.value || ""} 
                                    onChange={e => field.onChange(parseFormattedNumber(e.target.value))} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.precoArroba`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="text" className="h-9 text-right" 
                                    value={field.value || ""} 
                                    onChange={e => field.onChange(parseFormattedNumber(e.target.value))} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right font-medium bg-muted/20">
                          {formatCurrency((items[index]?.quantidade || 0) * (items[index]?.peso || 0) * (items[index]?.precoArroba || 0))}
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rastreabilidade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} 
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-primary/5 p-4 border-t flex flex-col sm:flex-row items-end justify-end gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Total de Animais</span>
                  <span className="font-bold text-lg">{totalQtd}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Peso Total (@)</span>
                  <span className="font-bold text-lg">{totalPeso.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Valor Geral</span>
                  <span className="font-bold text-xl text-primary">{formatCurrency(totalValor)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b mb-4">
                <CardTitle className="text-lg">Condições de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {formaPagamento === "A PRAZO" && (
                    <FormField
                      control={form.control}
                      name="prazoPagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent>{PRAZOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b mb-4">
                <CardTitle className="text-lg">Dados Bancários do Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                {vendedorSelecionado ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Banco</span>
                        <span className="font-medium">{vendedorSelecionado.banco || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Agência</span>
                        <span className="font-medium">{vendedorSelecionado.agencia || '-'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Conta</span>
                        <span className="font-medium">{vendedorSelecionado.conta || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Titular</span>
                        <span className="font-medium">{vendedorSelecionado.titular || vendedorSelecionado.nome}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    Selecione um vendedor para exibir os dados bancários.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="text-lg">Observações Finais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} className="min-h-[100px]" placeholder="Anotações adicionais, observações sobre o gado, particularidades da negociação..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="w-48">
                <FormField
                  control={form.control}
                  name="dataCompra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Compra</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assinaturas */}
          <Card>
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="text-lg">Assinaturas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Digite manualmente o nome de quem assina como Comprador e como Vendedor.
                Esses nomes aparecerão impressos acima da linha no PDF, independente do cadastro.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="assinaturaComprador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome para assinatura - Comprador</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Digite o nome de quem irá assinar"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-center pt-6">
                    <div className="font-medium text-sm min-h-[20px]">
                      {form.watch("assinaturaComprador") || ""}
                    </div>
                    <div className="border-b border-foreground my-1"></div>
                    <div className="text-xs text-muted-foreground">Comprador</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="assinaturaVendedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome para assinatura - Vendedor</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Digite o nome de quem irá assinar"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-center pt-6">
                    <div className="font-medium text-sm min-h-[20px]">
                      {form.watch("assinaturaVendedor") || ""}
                    </div>
                    <div className="border-b border-foreground my-1"></div>
                    <div className="text-xs text-muted-foreground">Vendedor</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Floating Bar */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-card border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => form.reset()} className="flex-1 sm:flex-none">Limpar</Button>
              <Button type="button" variant="secondary" onClick={form.handleSubmit((d) => handleSave(d, 'rascunho'))} disabled={isSaving} className="flex-1 sm:flex-none">
                Salvar Rascunho
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="default" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={form.handleSubmit((d) => handleSave(d, 'emitido', true))} disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Emitir e Gerar PDF
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Visualizar PDF: {currentPdfFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full bg-muted">
            {pdfBlobUrl && (
              <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="PDF Preview" />
            )}
          </div>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>Fechar</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                const a = document.createElement('a');
                a.href = pdfBlobUrl || '';
                a.download = currentPdfFileName;
                a.click();
              }}>
                <FileText className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
              <Button onClick={() => {
                handleWhatsApp(savedOrderForPdf);
              }}>
                <Send className="h-4 w-4 mr-2" /> Enviar WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
