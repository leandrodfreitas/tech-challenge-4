export const storageRepository = {
  async upload(
    userId: string,
    file: { uri: string; name: string; type: string },
  ): Promise<{ downloadUrl: string; fileName: string }> {
    console.log(
      "🔄 [STORAGE-BYPASS] Convertendo imagem para Base64 para salvar no Firestore...",
    );

    const base64Data = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(xhr.response as Blob);
      };
      xhr.onerror = function (e) {
        console.error("❌ Erro ao converter arquivo local para texto:", e);
        reject(new Error("Falha ao ler o arquivo local"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", file.uri, true);
      xhr.send(null);
    });

    return {
      downloadUrl: base64Data,
      fileName: file.name,
    };
  },

  async remove(filePath: string): Promise<void> {
    console.log("🗑️ [STORAGE-BYPASS] Nada a deletar no Storage físico.");
  },
};
