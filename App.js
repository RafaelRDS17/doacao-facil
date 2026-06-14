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

  // QUANDO O APP ABRE - verifica se já tem dados salvos no celular
  useEffect(() => {
    async function carregarPerfil() {
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
    }

    carregarPerfil();
  }, []); // o [] significa: rode isso apenas uma vez, quando o app abrir

  // MEMÓRIA DO APP - lista de todos os itens cadastrados para doação
  const [itens, setItens] = useState([]);


  // MEMÓRIA DO APP - guarda a foto escolhida pelo doador
  const [fotoItem, setFotoItem] = useState(null);

  // FUNÇÃO QUE PERGUNTA: CÂMERA OU GALERIA?
  function escolherFoto() {
    Alert.alert(
      'Adicionar Foto',
      'De onde você quer a foto?',
      [
        { text: 'Câmera',  onPress: () => abrirCamera()  },
        { text: 'Galeria', onPress: () => abrirGaleria() },
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
      aspect: [4, 3],
      quality: 0.8
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
      aspect: [4, 3],
      quality: 0.8
    });

    if (!resultado.canceled) {
      setFotoItem(resultado.assets[0].uri);
    }
  }

  // FUNÇÃO QUE SALVA O ITEM NA LISTA QUANDO O DOADOR TOCA EM "CADASTRAR"
  function cadastrarItem() {

    // monta o objeto com todos os dados do item e do doador
    const novoItem = {
      id: Date.now(),       // ID único usando a hora atual
      foto: fotoItem,
      nome: nomeItem || 'Item sem nome',
      descricao: descricaoItem || 'Sem descrição',
      doador: nome,
      cidade: cidade,
      contato: '(' + ddd + ') ' + telefone
    };

    // adiciona o novo item à lista existente
    setItens([...itens, novoItem]);

    // limpa os campos do formulário após cadastrar
    setFotoItem(null);
    setNomeItem('');
    setDescricaoItem('');

    // mostra uma janela de confirmação bem visível
    Alert.alert('Sucesso!', 'Seu item foi cadastrado para doação.');
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

          {/* BOTÃO PARA QUEM QUER DOAR - agora navega para a tela do doador */}
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

        {/* BOTÃO PARA ABRIR A GALERIA */}
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

          {/* BOTÃO CADASTRAR - agora salva o item na lista */}
          <TouchableOpacity
            style={styles.botaoDourado}
            onPress={cadastrarItem}
          >
            <Text style={styles.textoBotaoDourado}>Cadastrar</Text>
          </TouchableOpacity>

          {/* BOTÃO VOLTAR - retorna para a tela inicial */}
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

        {/* LISTA DE ITENS - um card para cada item cadastrado */}
        {itens.map((item) => (
          <View key={item.id} style={styles.card}>

            {/* FOTO DO ITEM - só aparece se o doador adicionou foto */}
            {item.foto && (
              <Image
                source={{ uri: item.foto }}
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

  // mensagem verde que aparece após cadastrar com sucesso
  mensagemSucesso: {
    width: '100%',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#C9A84C',
    color: '#7A5200',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
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
    borderColor: '#C9A84C'
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
    height: 180,
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
    alignItems: 'center'
  },

  // texto do botão de interesse
  textoBotaoInteresse: {
    color: '#FFFFFF',
    fontSize: 15,
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
