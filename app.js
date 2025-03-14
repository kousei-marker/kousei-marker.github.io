document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll("#shogi-board td");
  let selectedCell = null; // 現在選択されている駒のセル
  let selectedPiece = null; // 選択された駒の名前
  let currentPlayer = "friendly"; // 先手(friendly) か 後手(enemy) かを管理


  // **持ち駒のクリックイベントを追加**
  document.addEventListener("click", (event) => {
    const piece = event.target;

    // **持ち駒のクリック処理**
    if (piece.classList.contains("piece") && piece.closest("#playerA-captured, #playerB-captured")) {
      selectedCell = piece;  // 持ち駒の要素をセット
      selectedPiece = piece.textContent;  // 駒の種類を取得（例: "歩", "飛", "角" など）

      console.log("持ち駒がクリックされました:", selectedPiece);
      console.log("selectedCell:", selectedCell);
      console.log("selectedPiece:", selectedPiece);

      // 選択状態を可視化（背景色を変更）
      document.querySelectorAll(".piece").forEach(p => p.style.backgroundColor = "");
      piece.style.backgroundColor = "orange";

      return;
    }
  });

  // **すべてのセルにクリックイベントを追加**
  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      console.log("クリックされたセル:", cell);

      // **持ち駒を打つ処理（持ち駒が選択されており、空白のセルをクリックした場合のみ）**
      if (selectedCell && selectedPiece && isCapturedPiece(selectedCell) && !cell.textContent) {
        placePiece(cell);
        console.log("placePiece発動！（持ち駒を打つ）");
        return;
      }

      // **盤上の駒を選択**
      if (cell.classList.contains(currentPlayer) && !selectedCell) {
        selectPiece(cell);
        console.log("selectPiece発動！（駒を選択）");
        return;
      }

      // **駒の移動処理（駒を選択しており、移動可能マスをクリックした場合）**
      if (cell.classList.contains("option") && selectedCell && !isCapturedPiece(selectedCell)) {
        movePiece(cell);
        console.log("movePiece発動！（駒を移動）");
        return;
      }

      // **リセット処理（その他のケース）**
      resetSelection();
      console.log("resetSelection発動！（選択解除）");
    });
  });

  // **駒が持ち駒エリアにあるかを判定**
  function isCapturedPiece(cell) {
    return cell && (cell.parentElement.id === "playerA-captured" || cell.parentElement.id === "playerB-captured");
  }



  // **(追加) 持ち駒を盤上に置く処理**
  function placePiece(cell) {
    if (!selectedPiece || !selectedCell) return;

    // デバッグ用ログ
    console.log("placePiece実行: selectedPiece =", selectedPiece);
    console.log("selectedCellのデータプレイヤー:", selectedCell.getAttribute("data-player"));
    console.log("currentPlayer:", currentPlayer);

    // **データプレイヤーが設定されていなければ currentPlayer をセット**
    if (!selectedCell.getAttribute("data-player")) {
      selectedCell.setAttribute("data-player", currentPlayer);
      console.log("data-player を設定:", currentPlayer);
    }

    // 持ち駒が現在のプレイヤーのものか確認
    if (selectedCell.getAttribute("data-player") !== currentPlayer) {
      console.log("エラー: 相手の持ち駒は打てません！");
      return;
    }

    // セルに駒を追加
    cell.textContent = selectedCell.textContent; // 駒の種類をテキストコンテンツに設定
    cell.classList.add("piece", currentPlayer); // 駒のクラスを追加
    cell.setAttribute("data-player", currentPlayer); // 駒の所有者を設定
    cell.setAttribute("alt", selectedCell.getAttribute("alt")); // 駒の種類を alt 属性に設定

    // 手持ちの駒を削除
    selectedCell.remove();

    // alt 属性の値をコンソールに出力
    console.log("駒の alt 属性:", cell.getAttribute("alt"));

    // 選択状態をリセット
    selectedCell = null;
    selectedPiece = null;

    console.log("持ち駒を打った:", cell.textContent, "所有者:", currentPlayer);

    // ターンを交代
    switchTurn();
  }



  // **(追加) 二歩のチェック（同じ列に歩があるか）**
  function canPlaceFu(col) {
    const allCells = document.querySelectorAll(`#shogi-board tr td:nth-child(${col})`);
    for (let cell of allCells) {
      if (cell.getAttribute("alt") === (currentPlayer === "friendly" ? "fuA" : "fuB")) {
        return false; // すでに歩があるので配置不可
      }
    }
    return true;
  }



  // 駒を選択する関数
  function selectPiece(cell) {
    resetSelection(); // 選択状態をリセット
    selectedCell = cell; // 選択されたセルを保存
    selectedPiece = cell.getAttribute("alt"); // 駒の名前を取得
    cell.style.backgroundColor = "orange"; // 駒の背景色を赤に設定

    // 駒の移動可能な地点をハイライト
    const row = cell.parentElement.rowIndex + 1; // 行番号
    const col = cell.cellIndex + 1; // 列番号
    highlightMoves(row, col, selectedPiece);
  }

  // 駒を移動する関数（成る機能追加）
  function movePiece(targetCell) {
    const newRow = targetCell.parentElement.rowIndex + 1;
    const newCol = targetCell.cellIndex + 1;

    // 味方の駒がある場合、移動できない
    if (targetCell.classList.contains(currentPlayer)) {
      resetSelection();
      return;
    }

    if (targetCell.classList.contains(currentPlayer === "friendly" ? "enemy" : "friendly")) {
      capturePiece(targetCell);
    }

    // **正しくターゲットのセルに駒を移動**
    targetCell.textContent = selectedCell.textContent;
    targetCell.setAttribute("alt", selectedPiece);
    targetCell.classList.add(currentPlayer);
    targetCell.classList.remove("option", currentPlayer === "friendly" ? "enemy" : "friendly");
    targetCell.style.transform = currentPlayer === "friendly" ? "rotate(0deg)" : "rotate(180deg)";


    // **元のセルをクリア**
    selectedCell.textContent = "";
    selectedCell.removeAttribute("alt");
    selectedCell.classList.remove(currentPlayer);

    // 成るかどうかを判定
    if (canPromote(selectedPiece, newRow)) {
      let result = confirm("なりますか？");
      if (result) {
        promotePiece(targetCell);
      }
    }

    resetSelection(); // 選択をリセット
    switchTurn(); // ターンを交代
  }


  function capturePiece(cell) {
    let capturedPiece = cell.getAttribute("alt");

    // デバッグ用ログ
    console.log("capturePiece = " + capturedPiece);
    
    // 成り駒を元の駒に戻すマッピング
    const unpromoteMap = {
      "nkakuA": "kaku",  // 成った角（馬）→ 角
      "nkakuB": "kaku",
      "nhisyaA": "hisya",  // 成った飛（龍）→ 飛
      "nhisyaB": "hisya",
      "nginA": "gin",  // 成銀（全）→ 銀
      "nginB": "gin",
      "nkeiA": "kei",  // 成桂（圭）→ 桂
      "nkeiB": "kei",
      "nkyoA": "kyo",  // 成香（杏）→ 香
      "nkyoB": "kyo",
      "toA": "fu",   // と金（と）→ 歩
      "toB": "fu"
    };

    // 成り駒なら元の駒に戻す
    let pieceToStore = unpromoteMap[capturedPiece] || capturedPiece;
    
    console.log("pieceToStore = " + pieceToStore);

    // 先手番か後手番かで alt 属性を設定
    let newAlt = pieceToStore.replace(/A|B/g, '') + (currentPlayer === "friendly" ? "A" : "B");

    let useArea = currentPlayer === "friendly" ? document.getElementById("playerA-captured") : document.getElementById("playerB-captured");

    let newPiece = document.createElement("div");

    // 駒の名前を日本語に設定
    switch (pieceToStore.replace(/A|B/g, '')) {
      case "fu":
        newPiece.textContent = "歩";
        break;
      case "kyo":
        newPiece.textContent = "香";
        break;
      case "kei":
        newPiece.textContent = "桂";
        break;
      case "gin":
        newPiece.textContent = "銀";
        break;
      case "kin":
        newPiece.textContent = "金";
        break;
      case "hisya":
        newPiece.textContent = "飛";
        break;
      case "kaku":
        newPiece.textContent = "角";
        break;
      default:
        newPiece.textContent = pieceToStore.replace(/A|B/g, '');  // 正しい駒の名前を設定
        break;
    }

    newPiece.setAttribute("alt", newAlt); // alt を設定
    newPiece.classList.add("piece");

    useArea.appendChild(newPiece);

    // 駒の textContent をコンソールに出力
    console.log("手持ちの駒の textContent:", newPiece.textContent);


    // 盤上から駒を削除
    cell.textContent = "";
    cell.removeAttribute("alt");
    cell.classList.remove("enemy", "friendly");
  }



  // ターンの交代
  function switchTurn() {
    currentPlayer = currentPlayer === "friendly" ? "enemy" : "friendly";
    console.log("Current turn:", currentPlayer);
  }

  // 成れるかどうかを判定する関数
  function canPromote(piece, row) {
    const playerA = ["fuA", "kyoA", "keiA", "ginA", "hisyaA", "kakuA"]; // 先手の駒
    const playerB = ["fuB", "kyoB", "keiB", "ginB", "hisyaB", "kakuB"]; // 後手の駒

    if (playerA.includes(piece) && row <= 3) return true; // 先手の成りエリア
    if (playerB.includes(piece) && row >= 7) return true; // 後手の成りエリア
    return false;
  }

  // 成る処理を行う関数
  function promotePiece(cell) {
    let piece = cell.getAttribute("alt");

    switch (piece) {
      case "fuA":
        cell.setAttribute("alt", "toA"); // と金
        cell.textContent = "と";
        break;
      case "fuB":
        cell.setAttribute("alt", "toB"); // と金
        cell.textContent = "と";
        break;
      case "kyoA":
        cell.setAttribute("alt", "nkyoA"); // 成香
        cell.textContent = "杏";
        break;
      case "kyoB":
        cell.setAttribute("alt", "nkyoB"); // 成香
        cell.textContent = "杏";
        break;
      case "keiA":
        cell.setAttribute("alt", "nkeiA"); // 成桂
        cell.textContent = "圭";
        break;
      case "keiB":
        cell.setAttribute("alt", "nkeiB"); // 成桂
        cell.textContent = "圭";
        break;
      case "ginA":
        cell.setAttribute("alt", "nginA"); // 成銀
        cell.textContent = "全";
        break;
      case "ginB":
        cell.setAttribute("alt", "nginB"); // 成銀
        cell.textContent = "全";
        break;
      case "hisyaA":
        cell.setAttribute("alt", "nhisyaA"); // 龍王（成飛車）
        cell.textContent = "龍";
        break;
      case "hisyaB":
        cell.setAttribute("alt", "nhisyaB"); // 龍王（成飛車）
        cell.textContent = "龍";
        break;
      case "kakuA":
        cell.setAttribute("alt", "nkakuA"); // 龍馬（成角）
        cell.textContent = "馬";
        break;
      case "kakuB":
        cell.setAttribute("alt", "nkakuB"); // 龍馬（成角）
        cell.textContent = "馬";
        break;
      default:
        console.log("この駒は成れません");
        break;
    }
  }


  // 選択状態をリセットする関数
  function resetSelection() {
    cells.forEach((cell) => {
      cell.style.backgroundColor = ""; // 背景色をリセット
      cell.classList.remove("option"); // ハイライトを削除
    });
    selectedCell = null;
    selectedPiece = null;
  }



  function highlightMoves(row, col, piece, player) {

    switch (piece) {
      case "fuA": // 先手の歩
        highlightCell(row - 1, col);
        break;
      case "fuB": // 後手の歩
        highlightCell(row + 1, col);
        break;

      case "kyoA": // 先手の香車
        for (let i = row - 1; i >= 1; i--) {
          if (!highlightCell(i, col)) break;
        }
        break;
      case "kyoB": // 後手の香車
        for (let i = row + 1; i <= 9; i++) {
          if (!highlightCell(i, col)) break;
        }
        break;

      case "keiA": // 先手の桂馬
        highlightCell(row - 2, col - 1);
        highlightCell(row - 2, col + 1);
        break;
      case "keiB": // 後手の桂馬
        highlightCell(row + 2, col - 1);
        highlightCell(row + 2, col + 1);
        break;

      case "ginA": // 先手の銀将
        highlightCell(row - 1, col);
        highlightCell(row - 1, col - 1);
        highlightCell(row - 1, col + 1);
        highlightCell(row + 1, col - 1);
        highlightCell(row + 1, col + 1);
        break;
      case "ginB": // 後手の銀将
        highlightCell(row + 1, col);
        highlightCell(row + 1, col - 1);
        highlightCell(row + 1, col + 1);
        highlightCell(row - 1, col - 1);
        highlightCell(row - 1, col + 1);
        break;

      case "kinA": case "toA": case "nkyoA": case "nkeiA": case "nginA": // 先手の金将・成り駒
        highlightCell(row - 1, col);
        highlightCell(row + 1, col);
        highlightCell(row, col - 1);
        highlightCell(row, col + 1);
        highlightCell(row - 1, col - 1);
        highlightCell(row - 1, col + 1);
        break;
      case "kinB": case "toB": case "nkyoB": case "nkeiB": case "nginB": // 後手の金将・成り駒
        highlightCell(row + 1, col);
        highlightCell(row - 1, col);
        highlightCell(row, col - 1);
        highlightCell(row, col + 1);
        highlightCell(row + 1, col - 1);
        highlightCell(row + 1, col + 1);
        break;

      case "gyokuA": case "gyokuB": // 玉将
        highlightCell(row - 1, col);
        highlightCell(row + 1, col);
        highlightCell(row, col - 1);
        highlightCell(row, col + 1);
        highlightCell(row - 1, col - 1);
        highlightCell(row - 1, col + 1);
        highlightCell(row + 1, col - 1);
        highlightCell(row + 1, col + 1);
        break;

      case "hisyaA": case "hisyaB": // 飛車
        for (let i = row - 1; i >= 1; i--) {
          if (!highlightCell(i, col)) break;
        }
        for (let i = row + 1; i <= 9; i++) {
          if (!highlightCell(i, col)) break;
        }
        for (let i = col - 1; i >= 1; i--) {
          if (!highlightCell(row, i)) break;
        }
        for (let i = col + 1; i <= 9; i++) {
          if (!highlightCell(row, i)) break;
        }
        break;

      case "kakuA": case "kakuB": // 角
        for (let i = 1; row - i >= 1 && col - i >= 1; i++) {
          if (!highlightCell(row - i, col - i)) break;
        }
        for (let i = 1; row - i >= 1 && col + i <= 9; i++) {
          if (!highlightCell(row - i, col + i)) break;
        }
        for (let i = 1; row + i <= 9 && col - i >= 1; i++) {
          if (!highlightCell(row + i, col - i)) break;
        }
        for (let i = 1; row + i <= 9 && col + i <= 9; i++) {
          if (!highlightCell(row + i, col + i)) break;
        }
        break;

      case "nhisyaA": case "nhisyaB": // 龍王（成飛車）
        highlightMoves(row, col, "hisyaA", player);
        highlightMoves(row, col, "gyokuA", player);
        break;

      case "nkakuA": case "nkakuB": // 龍馬（成角）
        highlightMoves(row, col, "kakuA", player);
        highlightMoves(row, col, "gyokuA", player);
        break;

      default:
        console.log("未定義の駒:", piece);
    }
  }


  // 指定したセルをハイライトする関数
  function highlightCell(row, col) {
    if (row < 1 || row > 9 || col < 1 || col > 9) return false;
    const targetCell = document.querySelector(
      `#shogi-board tr:nth-child(${row}) td:nth-child(${col})`
    );
    if (!targetCell) return false;

    // 味方の駒がある場合は進めない
    if (targetCell.classList.contains(currentPlayer)) return false;

    // 敵の駒がある場合はハイライトしてストップ
    if (targetCell.classList.contains(currentPlayer === "friendly" ? "enemy" : "friendly")) {
      targetCell.classList.add("option");
      targetCell.style.backgroundColor = "lightblue";
      return false; // これ以上奥に進めない
    }

    // 移動可能なマスをハイライト
    targetCell.classList.add("option");
    targetCell.style.backgroundColor = "lightblue";
    return true;
  }



});
