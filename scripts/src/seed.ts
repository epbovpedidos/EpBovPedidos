import {
  db,
  customersTable,
  ordersTable,
  orderItemsTable,
  pool,
} from "@workspace/db";

async function main() {
  const existing = await db.select().from(customersTable);
  if (existing.length > 0) {
    console.log(`Already have ${existing.length} customers, skipping seed.`);
    await pool.end();
    return;
  }

  const customers = await db
    .insert(customersTable)
    .values([
      {
        nome: "João Pereira",
        fazenda: "Fazenda Boa Vista",
        cpfCnpj: "123.456.789-00",
        inscricao: "ISE 1234567",
        endereco: "Rod. BR-364, KM 45",
        uf: "MT",
        municipio: "Rondonópolis",
        telefone: "(66) 99811-2233",
        email: "joao@fazendaboavista.com.br",
        roteiro: "Saída Rondonópolis-MT, BR-364 sentido Cuiabá, KM 45",
        banco: "Banco do Brasil",
        conta: "12345-6",
        agencia: "0987",
        titular: "João Pereira",
      },
      {
        nome: "Maria Souza",
        fazenda: "Fazenda Santa Clara",
        cpfCnpj: "987.654.321-00",
        inscricao: "ISE 7654321",
        endereco: "Estrada Santa Clara, s/n",
        uf: "MT",
        municipio: "Cuiabá",
        telefone: "(65) 98877-3344",
        email: "maria@santaclara.com.br",
        roteiro: "MT-130 sentido Poxoréu, KM 22",
        banco: "Sicredi",
        conta: "22220-1",
        agencia: "0102",
        titular: "Maria Souza",
      },
      {
        nome: "Carlos Mendes",
        fazenda: "Frigorífico São Mateus",
        cpfCnpj: "12.345.678/0001-99",
        inscricao: "IE 13.123.456-7",
        endereco: "Av. Industrial, 1500",
        uf: "GO",
        municipio: "Goiânia",
        telefone: "(62) 99955-1010",
        email: "compras@frigosaomateus.com.br",
        roteiro: "Av. Industrial, 1500 - Distrito Industrial",
        banco: "Itaú",
        conta: "55555-5",
        agencia: "1234",
        titular: "Frigorífico São Mateus LTDA",
      },
      {
        nome: "Pedro Lima",
        fazenda: "Fazenda Três Marias",
        cpfCnpj: "456.789.123-00",
        inscricao: "ISE 9988776",
        endereco: "Estrada Velha, KM 12",
        uf: "MS",
        municipio: "Campo Grande",
        telefone: "(67) 98123-4455",
        email: "pedro@tresmarias.com.br",
        roteiro: "BR-163 sentido Coxim, KM 88",
        banco: "Bradesco",
        conta: "33214-0",
        agencia: "4444",
        titular: "Pedro Lima",
      },
      {
        nome: "Boi Forte Comércio",
        fazenda: "CD Boi Forte",
        cpfCnpj: "33.444.555/0001-22",
        inscricao: "IE 33.444.555-1",
        endereco: "Rod. dos Pecuaristas, 200",
        uf: "MT",
        municipio: "Sinop",
        telefone: "(66) 99700-1122",
        email: "compras@boiforte.com.br",
        roteiro: "Rod. dos Pecuaristas, 200, KM 4",
        banco: "Banco do Brasil",
        conta: "78900-3",
        agencia: "5677",
        titular: "Boi Forte Com. e Indústria",
      },
    ])
    .returning();

  type SeedItem = {
    especie: string;
    raca: string;
    idade: string;
    quantidade: number;
    peso: number;
    precoArroba: number;
    rastreabilidade: boolean;
  };

  const orders: Array<{
    numero: string;
    compradorIdx: number;
    vendedorIdx: number;
    daysAgo: number;
    formaPagamento: string;
    prazoPagamento: string | null;
    items: SeedItem[];
    observacao: string;
  }> = [
    {
      numero: "0001",
      compradorIdx: 2,
      vendedorIdx: 0,
      daysAgo: 32,
      formaPagamento: "A PRAZO",
      prazoPagamento: "30 dias",
      observacao: "Carga sujeita a conferência no frigorífico.",
      items: [
        {
          especie: "Boi para Abate",
          raca: "Nelore",
          idade: "25 a 36",
          quantidade: 80,
          peso: 1340,
          precoArroba: 305,
          rastreabilidade: true,
        },
        {
          especie: "Vaca para Abate",
          raca: "Anelorado",
          idade: "+36",
          quantidade: 20,
          peso: 320,
          precoArroba: 280,
          rastreabilidade: false,
        },
      ],
    },
    {
      numero: "0002",
      compradorIdx: 4,
      vendedorIdx: 1,
      daysAgo: 25,
      formaPagamento: "À VISTA",
      prazoPagamento: null,
      observacao: "Pagamento na entrega.",
      items: [
        {
          especie: "Boi para Abate",
          raca: "Angus",
          idade: "13 a 24",
          quantidade: 60,
          peso: 1050,
          precoArroba: 320,
          rastreabilidade: true,
        },
      ],
    },
    {
      numero: "0003",
      compradorIdx: 2,
      vendedorIdx: 3,
      daysAgo: 14,
      formaPagamento: "A PRAZO",
      prazoPagamento: "30/60/90 dias",
      observacao: "Programado para embarque na próxima semana.",
      items: [
        {
          especie: "Novilha para Abate",
          raca: "Cruzado",
          idade: "13 a 24",
          quantidade: 45,
          peso: 720,
          precoArroba: 295,
          rastreabilidade: true,
        },
        {
          especie: "Bezerras",
          raca: "Nelore",
          idade: "5 a 12",
          quantidade: 30,
          peso: 240,
          precoArroba: 270,
          rastreabilidade: false,
        },
      ],
    },
    {
      numero: "0004",
      compradorIdx: 4,
      vendedorIdx: 0,
      daysAgo: 6,
      formaPagamento: "A PRAZO",
      prazoPagamento: "15 dias",
      observacao: "Entrega parcial autorizada.",
      items: [
        {
          especie: "Garrote",
          raca: "Nelore",
          idade: "13 a 24",
          quantidade: 50,
          peso: 700,
          precoArroba: 290,
          rastreabilidade: true,
        },
      ],
    },
    {
      numero: "0005",
      compradorIdx: 2,
      vendedorIdx: 1,
      daysAgo: 2,
      formaPagamento: "À VISTA",
      prazoPagamento: null,
      observacao: "",
      items: [
        {
          especie: "Boi para Abate",
          raca: "Nelore",
          idade: "25 a 36",
          quantidade: 100,
          peso: 1700,
          precoArroba: 310,
          rastreabilidade: true,
        },
        {
          especie: "Touro",
          raca: "Angus",
          idade: "+36",
          quantidade: 5,
          peso: 95,
          precoArroba: 350,
          rastreabilidade: true,
        },
      ],
    },
  ];

  for (const o of orders) {
    let totalAnimais = 0;
    let totalPeso = 0;
    let totalValor = 0;
    for (const it of o.items) {
      totalAnimais += it.quantidade;
      totalPeso += it.peso;
      totalValor += it.peso * it.precoArroba;
    }
    const date = new Date();
    date.setDate(date.getDate() - o.daysAgo);

    const [order] = await db
      .insert(ordersTable)
      .values({
        numero: o.numero,
        dataEmissao: date,
        compradorId: customers[o.compradorIdx].id,
        vendedorId: customers[o.vendedorIdx].id,
        roteiro: customers[o.vendedorIdx].roteiro,
        formaPagamento: o.formaPagamento,
        prazoPagamento: o.prazoPagamento,
        observacao: o.observacao,
        dataCompra: date.toISOString().slice(0, 10),
        status: "emitido",
        totalAnimais,
        totalPeso: String(Math.round(totalPeso * 100) / 100),
        totalValor: String(Math.round(totalValor * 100) / 100),
      })
      .returning();

    await db.insert(orderItemsTable).values(
      o.items.map((it) => ({
        orderId: order.id,
        especie: it.especie,
        raca: it.raca,
        idade: it.idade,
        quantidade: it.quantidade,
        peso: String(it.peso),
        precoArroba: String(it.precoArroba),
        total: String(Math.round(it.peso * it.precoArroba * 100) / 100),
        rastreabilidade: it.rastreabilidade,
      })),
    );
  }

  console.log(`Seeded ${customers.length} customers and ${orders.length} orders.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
