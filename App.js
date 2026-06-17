// Importamos tudo que vamos usar do React Native
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';

// SUPABASE - importamos o cliente que configuramos no arquivo supabase.js
import { supabase } from './supabase';


export default function App() {

  // MEMÓRIA DO APP - guarda o nome que o usuário digitar
  const [nome, setNome] = useState('');

  // MEMÓRIA DO APP - controla qual tela aparece (começa na tela de boas-vindas)
  const [tela, setTela] = useState('boasvindas');

  // MEMÓRIA DO APP - guarda os dados do perfil do usuário
  const [cidade, setCidade] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');

  // MEMÓRIA DO APP - guarda os dados do formulário do doador
  const [nomeItem, setNomeItem] = useState('');
  const [descricaoItem, setDescricaoItem] = useState('');

  // MEMÓRIA DO APP - lista de todos os itens (agora vem do Supabase)
  const [itens, setItens] = useState([]);

  // MEMÓRIA DO APP - guarda a foto escolhida pelo doador
  const [fotoItem, setFotoItem] = useState(null);

  // QUANDO O APP ABRE - carrega o perfil salvo e os itens do Supabase
  useEffect(() => {
    async function carregarTudo() {
      const nomeSalvo     = await AsyncStorage.getItem('nome');
      const cidadeSalva   = await AsyncStorage.getItem('cidade');
      const dddSalvo      = await AsyncStorage.getItem('ddd');
      const telefoneSalvo = await AsyncStorage.getItem('telefone');

      // se encontrou dados salvos, preenche os campos automaticamente
      if (nomeSalvo)     setNome(nomeSalvo);
      if (cidadeSalva)   setCidade(cidadeSalva);
      if (dddSalvo)      setDdd(dddSalvo);
      if (telefoneSalvo) setTelefone(telefoneSalvo);

      // se já tem nome salvo, pula direto para a tela inicial
      if (nomeSalvo) setTela('inicio');

      // busca os itens lá no banco de dados na nuvem
      await carregarItens();
    }

    carregarTudo();
  }, []); // o [] significa: rode isso apenas uma vez, quando o app abrir


  // FUNÇÃO QUE BUSCA OS ITENS NO SUPABASE E TRAZ PARA O APP
  async function carregarItens() {
    // .from('itens') → nome da tabela que criamos no Supabase
    // .select('*')   → pega todas as colunas da tabela
    // .order(...)    → ordena do mais recente para o mais antigo
    const { data, error } = await supabase
      .from('itens')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar os itens. Verifique sua conexão.');
      return;
    }

    // data é o array de itens que veio do banco — colocamos na memória do app
    setItens(data);
  }


  // FUNÇÃO QUE PERGUNTA: CÂMERA OU GALERIA?
  function escolherFoto() {
    Alert.alert(
      'Adicionar Foto',
      'De onde você quer a foto?',
      [
        { text: 'Câmera',   onPress: () => abrirCamera()  },
        { text: 'Galeria',  onPress: () => abrirGaleria() },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  }

  // FUNÇÃO QUE ABRE A CÂMERA DO CELULAR
  async function abrirCamera() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();

    // se o usuário não deu permissão para usar a câmera
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1        // qualidade máxima da foto
    });

    if (!resultado.canceled) {
      setFotoItem(resultado.assets[0].uri);
    }
  }

  // FUNÇÃO QUE ABRE A GALERIA DO CELULAR
  async function abrirGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1        // qualidade máxima da foto
    });

    if (!resultado.canceled) {
      setFotoItem(resultado.assets[0].uri);
    }
  }


  // FUNÇÃO QUE SALVA O ITEM NO SUPABASE QUANDO O DOADOR TOCA EM "CADASTRAR"
  async function cadastrarItem() {

    // PASSO 1: se tem foto, envia ela para o Supabase Storage (armazenamento de arquivos na nuvem)
    let fotoUrl = null;

    if (fotoItem) {
      // converte a foto em dados que podem ser enviados pela internet
      const arrayBuffer = await fetch(fotoItem).then(res => res.arrayBuffer());
      const nomeArquivo = `foto_${Date.now()}.jpg`; // nome único usando a hora atual

      // .from('fotos') → bucket (pasta) que criamos no Supabase Storage
      // .upload(...)   → envia o arquivo para a nuvem
      const { error: erroUpload } = await supabase.storage
        .from('fotos')
        .upload(nomeArquivo, arrayBuffer, { contentType: 'image/jpeg' });

      if (!erroUpload) {
        // pega o link público da foto — qualquer celular pode acessar esse link
        const { data } = supabase.storage
          .from('fotos')
          .getPublicUrl(nomeArquivo);
        fotoUrl = data.publicUrl;
      }
    }

    // PASSO 2: salva os dados do item no banco de dados do Supabase
    // .from('itens') → nossa tabela
    // .insert({...}) → insere uma nova linha com esses dados
    const { error } = await supabase.from('itens').insert({
      nome:      nomeItem || 'Item sem nome',
      descricao: descricaoItem || 'Sem descrição',
      foto_url:  fotoUrl,           // link da foto no Storage (ou null se não teve foto)
      doador:    nome,
      cidade:    cidade,
      contato:   '(' + ddd + ') ' + telefone
    });

    if (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar o item. Verifique sua conexão.');
      return;
    }

    // PASSO 3: recarrega a lista atualizada direto do Supabase
    await carregarItens();

    // limpa os campos do formulário após cadastrar
    setFotoItem(null);
    setNomeItem('');
    setDescricaoItem('');

    // mostra uma janela de confirmação bem visível
    Alert.alert('Sucesso!', 'Seu item foi cadastrado para doação.');
  }


  // FUNÇÃO QUE EXCLUI UM ITEM DO SUPABASE
  async function excluirItem(id) {

    // pede confirmação antes de excluir (segurança para não excluir por engano)
    Alert.alert(
      'Excluir anúncio',
      'Tem certeza que quer excluir este anúncio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // .from('itens') → nossa tabela
            // .delete()      → apaga a linha
            // .eq('id', id)  → somente onde o id for igual ao id do item escolhido
            const { error } = await supabase
              .from('itens')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
              return;
            }

            // recarrega a lista já sem o item excluído
            await carregarItens();
            Alert.alert('Pronto!', 'Anúncio excluído com sucesso.');
          }
        }
      ]
    );
  }


  // ================================
  // TELA DE BOAS-VINDAS
  // ================================
  function renderBoasVindas() {
    return (
      <View style={styles.conteudo}>

        {/* IMAGEM DO APP */}
        <Image
          source={require('./assets/doacao.png')}
          style={styles.imagem}
          resizeMode="contain"
        />

        {/* TÍTULO DO APP */}
        <Text style={styles.titulo}>Doação Fácil</Text>

        {/* FRASE DE APRESENTAÇÃO */}
        <Text style={styles.subtitulo}>
          Conecte quem tem com quem precisa
        </Text>

        {/* CAMPO NOME */}
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
        />

        {/* CAMPO CIDADE OU BAIRRO */}
        <TextInput
          style={styles.input}
          placeholder="Cidade ou bairro"
          value={cidade}
          onChangeText={setCidade}
        />

        {/* LINHA COM DDD E NÚMERO DE CELULAR LADO A LADO */}
        <View style={styles.linhaTelefone}>

          {/* CAMPO DDD - pequeno, só 2 dígitos */}
          <TextInput
            style={styles.inputDdd}
            placeholder="DDD"
            value={ddd}
            onChangeText={setDdd}
            keyboardType="numeric"
            maxLength={2}
          />

          {/* CAMPO NÚMERO - ocupa o resto da linha */}
          <TextInput
            style={styles.inputTelefone}
            placeholder="Número do celular"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="numeric"
            maxLength={9}
          />

        </View>

        {/* BOTÃO ENTRAR - salva os dados e leva para a tela inicial */}
        <TouchableOpacity
          style={styles.botaoDourado}
          onPress={async () => {
            // salva cada dado separadamente no celular
            await AsyncStorage.setItem('nome',     nome);
            await AsyncStorage.setItem('cidade',   cidade);
            await AsyncStorage.setItem('ddd',      ddd);
            await AsyncStorage.setItem('telefone', telefone);
            setTela('inicio');
          }}
        >
          <Text style={styles.textoBotaoDourado}>Entrar</Text>
        </TouchableOpacity>

      </View>
    );
  }


  // ================================
  // TELA INICIAL
  // ================================
  function renderInicio() {
    return (
      <View style={styles.conteudo}>

        {/* SAUDAÇÃO COM O NOME DO USUÁRIO */}
        <Text style={styles.titulo}>Olá, {nome || 'visitante'}!</Text>

        {/* PERGUNTA PRINCIPAL */}
        <Text style={styles.subtitulo}>O que você deseja fazer?</Text>

        {/* ÁREA DOS BOTÕES */}
        <View style={styles.areaBotoes}>

          {/* BOTÃO PARA QUEM QUER DOAR */}
          <TouchableOpacity
            style={styles.botaoDourado}
            onPress={() => setTela('doador')}
          >
            <Text style={styles.textoBotaoDourado}>Quero Doar</Text>
          </TouchableOpacity>

          {/* BOTÃO PARA QUEM QUER RECEBER */}
          <TouchableOpacity
            style={styles.botaoBranco}
            onPress={() => setTela('receptor')}
          >
            <Text style={styles.textoBotaoBranco}>Quero Receber</Text>
          </TouchableOpacity>

          {/* BOTÃO VOLTAR - retorna para a tela de boas-vindas */}
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela('boasvindas')}
          >
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }


  // ================================
  // TELA DO DOADOR
  // ================================
  function renderDoador() {
    return (
      <View style={styles.conteudo}>

        {/* TÍTULO DA TELA */}
        <Text style={styles.titulo}>Cadastrar Doação</Text>

        {/* INSTRUÇÃO */}
        <Text style={styles.subtitulo}>
          Preencha os dados do item que deseja doar
        </Text>

        {/* BOTÃO PARA ESCOLHER FOTO */}
        <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
          <Text style={styles.textoBotaoFoto}>+ Adicionar Foto do Item</Text>
        </TouchableOpacity>

        {/* PRÉVIA DA FOTO - só aparece depois de escolher */}
        {fotoItem && (
          <Image
            source={{ uri: fotoItem }}
            style={styles.fotoPreview}
            resizeMode="cover"
          />
        )}

        {/* CAMPO NOME DO ITEM */}
        <TextInput
          style={styles.input}
          placeholder="Nome do item (ex: Mochila escolar)"
          value={nomeItem}
          onChangeText={setNomeItem}
        />

        {/* CAMPO DESCRIÇÃO - maior para caber mais texto */}
        <TextInput
          style={[styles.input, styles.inputGrande]}
          placeholder="Descrição (ex: Em bom estado, tamanho médio)"
          value={descricaoItem}
          onChangeText={setDescricaoItem}
          multiline
        />

        {/* ÁREA DOS BOTÕES */}
        <View style={styles.areaBotoes}>

          {/* BOTÃO CADASTRAR - salva no Supabase */}
          <TouchableOpacity
            style={styles.botaoDourado}
            onPress={cadastrarItem}
          >
            <Text style={styles.textoBotaoDourado}>Cadastrar</Text>
          </TouchableOpacity>

          {/* BOTÃO VOLTAR */}
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela('inicio')}
          >
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }


  // ================================
  // TELA DO RECEPTOR
  // ================================
  function renderReceptor() {
    return (
      <View style={styles.conteudo}>

        {/* TÍTULO DA TELA */}
        <Text style={styles.titulo}>Itens Disponíveis</Text>

        {/* SUBTÍTULO */}
        <Text style={styles.subtitulo}>
          Veja o que está disponível para doação
        </Text>

        {/* SE NÃO HOUVER ITENS, MOSTRA UMA MENSAGEM */}
        {itens.length === 0 && (
          <Text style={styles.semItens}>
            Nenhum item disponível ainda.{'\n'}
            Volte mais tarde!
          </Text>
        )}

        {/* LISTA DE ITENS - ordenada: seus anúncios primeiro, depois os dos outros */}
        {itens
          .slice() // cria uma cópia da lista para não alterar a original
          .sort((a, b) => {
            // o .sort() compara dois itens por vez (a e b) e decide a ordem
            // retornar -1 → 'a' vem antes de 'b'
            // retornar  1 → 'b' vem antes de 'a'
            // retornar  0 → mantém a ordem atual entre os dois
            if (a.doador === nome && b.doador !== nome) return -1; // meu item sobe
            if (b.doador === nome && a.doador !== nome) return  1; // item alheio desce
            return 0; // ambos meus ou ambos de outros → mantém a ordem
          })
          .map((item) => (
          <View key={item.id} style={styles.card}>

            {/* FOTO DO ITEM - agora vem do link público do Supabase Storage */}
            {item.foto_url && (
              <Image
                source={{ uri: item.foto_url }}
                style={styles.fotoCard}
                resizeMode="cover"
              />
            )}

            {/* NOME DO ITEM */}
            <Text style={styles.nomeCard}>{item.nome}</Text>

            {/* DESCRIÇÃO */}
            <Text style={styles.descricaoCard}>{item.descricao}</Text>

            {/* CIDADE DO DOADOR */}
            <Text style={styles.cidadeCard}>{item.cidade}</Text>

            {/* NOME DO DOADOR */}
            <Text style={styles.doadorCard}>Doado por: {item.doador}</Text>

            {/* BOTÃO DE INTERESSE - mostra o contato do doador */}
            <TouchableOpacity
              style={styles.botaoInteresse}
              onPress={() =>
                Alert.alert(
                  'Contato do Doador',
                  'Entre em contato com ' + item.doador + ':\n' + item.contato
                )
              }
            >
              <Text style={styles.textoBotaoInteresse}>Tenho Interesse</Text>
            </TouchableOpacity>

            {/* BOTÃO EXCLUIR - só aparece se o nome do doador for igual ao seu nome */}
            {item.doador === nome && (
              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => excluirItem(item.id)}
              >
                <Text style={styles.textoBotaoExcluir}>Excluir meu anúncio</Text>
              </TouchableOpacity>
            )}

          </View>
        ))}

        {/* BOTÃO VOLTAR */}
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => setTela('inicio')}
        >
          <Text style={styles.textoBotaoVoltar}>Voltar</Text>
        </TouchableOpacity>

      </View>
    );
  }


  // ================================
  // DECIDE QUAL TELA MOSTRAR
  // ================================
  function renderTelaAtual() {
    if (tela === 'boasvindas') return renderBoasVindas();
    if (tela === 'doador')     return renderDoador();
    if (tela === 'receptor')   return renderReceptor();
    return renderInicio();
  }


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderTelaAtual()}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );

}


// ================================
// ESTILOS DO APP
// ================================
const styles = StyleSheet.create({

  // tela inteira
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0'
  },

  // área de rolagem
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },

  // caixa central do conteúdo
  conteudo: {
    width: '100%',
    alignItems: 'center'
  },

  // imagem da tela de boas-vindas
  imagem: {
    width: '100%',
    height: 220,
    marginBottom: 24
  },

  // título principal
  titulo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7A5200',
    textAlign: 'center',
    marginBottom: 10
  },

  // frase abaixo do título
  subtitulo: {
    fontSize: 16,
    color: '#6B5C3E',
    textAlign: 'center',
    marginBottom: 32
  },

  // campo de texto padrão
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4B06A',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12
  },

  // linha que coloca DDD e telefone lado a lado
  linhaTelefone: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },

  // campo pequeno para o DDD
  inputDdd: {
    width: 70,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4B06A',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    textAlign: 'center'
  },

  // campo maior para o número
  inputTelefone: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4B06A',
    borderRadius: 8,
    padding: 14,
    fontSize: 16
  },

  // botão de adicionar foto
  botaoFoto: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9A84C',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },

  // texto do botão de foto
  textoBotaoFoto: {
    color: '#C9A84C',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // prévia da foto escolhida
  fotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12
  },

  // campo de texto maior (para descrição)
  inputGrande: {
    minHeight: 90,
    textAlignVertical: 'top'
  },

  // área que agrupa os botões
  areaBotoes: {
    width: '100%'
  },

  // botão dourado - ação principal
  botaoDourado: {
    width: '100%',
    backgroundColor: '#C9A84C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },

  // texto do botão dourado
  textoBotaoDourado: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // botão branco com borda dourada
  botaoBranco: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C9A84C',
    marginBottom: 12
  },

  // texto do botão branco
  textoBotaoBranco: {
    color: '#C9A84C',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // mensagem quando não há itens disponíveis
  semItens: {
    fontSize: 16,
    color: '#6B5C3E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26
  },

  // card de cada item disponível
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9B5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16
  },

  // foto dentro do card
  fotoCard: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginBottom: 12
  },

  // nome do item no card
  nomeCard: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A5200',
    marginBottom: 6
  },

  // descrição do item no card
  descricaoCard: {
    fontSize: 14,
    color: '#4D3A1A',
    marginBottom: 6,
    lineHeight: 20
  },

  // cidade do doador no card
  cidadeCard: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 4
  },

  // nome do doador no card
  doadorCard: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12
  },

  // botão de interesse dentro do card
  botaoInteresse: {
    backgroundColor: '#C9A84C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },

  // texto do botão de interesse
  textoBotaoInteresse: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  // botão de excluir - aparece em vermelho claro (indica ação destrutiva)
  botaoExcluir: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#E57373',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },

  // texto do botão excluir
  textoBotaoExcluir: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold'
  },

  // botão voltar - discreto, sem destaque
  botaoVoltar: {
    width: '100%',
    backgroundColor: '#F5EDD6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },

  // texto do botão voltar
  textoBotaoVoltar: {
    color: '#7A5200',
    fontSize: 16,
    fontWeight: 'bold'
  }

});
