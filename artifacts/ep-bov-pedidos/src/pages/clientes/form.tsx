import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetCustomer, 
  useCreateCustomer, 
  useUpdateCustomer, 
  getListCustomersQueryKey,
  getGetCustomerQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";

const customerSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fazenda: z.string().nullable().optional(),
  cpfCnpj: z.string().nullable().optional(),
  inscricao: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().email("E-mail inválido").nullable().optional().or(z.literal("")),
  roteiro: z.string().nullable().optional(),
  banco: z.string().nullable().optional(),
  conta: z.string().nullable().optional(),
  agencia: z.string().nullable().optional(),
  titular: z.string().nullable().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function ClienteForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!params.id && params.id !== "novo";
  const customerId = isEditing ? parseInt(params.id as string) : 0;

  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomer(customerId, {
    query: { enabled: isEditing, queryKey: getGetCustomerQueryKey(customerId) }
  });

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      nome: "",
      fazenda: "",
      cpfCnpj: "",
      inscricao: "",
      endereco: "",
      uf: "",
      municipio: "",
      telefone: "",
      email: "",
      roteiro: "",
      banco: "",
      conta: "",
      agencia: "",
      titular: "",
    },
  });

  useEffect(() => {
    if (customer && isEditing) {
      form.reset({
        nome: customer.nome,
        fazenda: customer.fazenda || "",
        cpfCnpj: customer.cpfCnpj || "",
        inscricao: customer.inscricao || "",
        endereco: customer.endereco || "",
        uf: customer.uf || "",
        municipio: customer.municipio || "",
        telefone: customer.telefone || "",
        email: customer.email || "",
        roteiro: customer.roteiro || "",
        banco: customer.banco || "",
        conta: customer.conta || "",
        agencia: customer.agencia || "",
        titular: customer.titular || "",
      });
    }
  }, [customer, isEditing, form]);

  const onSubmit = (data: CustomerFormValues) => {
    if (isEditing) {
      updateCustomer.mutate({ id: customerId, data }, {
        onSuccess: () => {
          toast({ title: "Cliente atualizado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(customerId) });
          setLocation("/clientes");
        },
        onError: () => {
          toast({ title: "Erro ao atualizar cliente", variant: "destructive" });
        }
      });
    } else {
      createCustomer.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Cliente cadastrado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setLocation("/clientes");
        },
        onError: () => {
          toast({ title: "Erro ao cadastrar cliente", variant: "destructive" });
        }
      });
    }
  };

  const isSaving = createCustomer.isPending || updateCustomer.isPending;

  if (isEditing && isLoadingCustomer) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Atualize os dados do cliente." : "Preencha os dados do novo cliente."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome / Razão Social *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fazenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fazenda</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF / CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inscricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Endereço e Logística</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="municipio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Município</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UFS.map(uf => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="roteiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roteiro Padrão</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} className="resize-none h-20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dados Bancários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="banco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="agencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titular</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/clientes">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
