let map;
let markers = [];
let parkingData = []; // 모든 주차장 데이터 저장
const ZOOM_LIMIT = 6; // 🚨 줌 레벨 제한 (10 이하로 축소되면 주차장 숨김)

function initMap() {
  var mapContainer = document.getElementById("map"),
    mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.978), // 서울 중심 좌표
      level: 3,
    };

  map = new kakao.maps.Map(mapContainer, mapOption);

  fetch("/map/api/parking-lots")
    .then((response) => response.json())
    .then((data) => {
      parkingData = data; // 모든 주차장 데이터 저장
      console.log("✅ 전체 주차장 데이터:", parkingData);
      updateVisibleParkingLots(); // 초기 필터링
    })
    .catch((error) =>
      console.error("❌ 주차장 데이터를 불러오지 못함:", error)
    );

  // 📌 지도 이동(드래그, 줌) 이벤트 리스너 추가
  kakao.maps.event.addListener(map, "bounds_changed", updateVisibleParkingLots);
  kakao.maps.event.addListener(map, "zoom_changed", handleZoomChange); // 📌 줌 변경 이벤트 추가
}

function handleZoomChange() {
  let zoomLevel = map.getLevel(); // 📌 현재 줌 레벨 가져오기
  console.log("🔍 현재 줌 레벨:", zoomLevel);

  if (zoomLevel >= ZOOM_LIMIT) {
    // 🚨 줌 레벨이 7 이상이면 모든 마커 숨김
    console.log("🔴 줌 아웃 상태: 모든 주차장 숨김");
    clearParkingList();
    clearMarkers();
    map.relayout();
    showZoomWarning();
    return;
  }

  hideZoomWarning();
  updateVisibleParkingLots(); // 줌 레벨이 낮아지면 다시 주차장 표시
}

function showZoomWarning() {
  let warning = document.getElementById("zoom-warning");
  warning.style.display = "block";
  warning.style.opacity = "1";

  clearTimeout(zoomWarningTimeout); // 기존 타이머 제거
  zoomWarningTimeout = setTimeout(() => {
    warning.style.opacity = "0";
    setTimeout(() => {
      warning.style.display = "none";
      map.relayout(); // 🚀 지도 상태 강제 업데이트 (지도 깨짐 방지)
    }, 500);
  }, 2000); // 🚀 2초 후 자동으로 사라짐
}

function hideZoomWarning() {
  let warning = document.getElementById("zoom-warning");
  warning.style.display = "none";
  map.relayout(); // 🚀 지도 상태 강제 업데이트 (지도 깨짐 방지)
}

function updateVisibleParkingLots() {
  if (!map || parkingData.length === 0) return;

  let zoomLevel = map.getLevel(); // 📌 현재 줌 레벨 가져오기
  if (zoomLevel >= ZOOM_LIMIT) return; // 🚨 줌 레벨이 너무 크면 바로 종료

  let bounds = map.getBounds(); // 📌 현재 지도에 보이는 영역 가져오기
  let visibleLots = parkingData.filter((lot) => {
    let position = new kakao.maps.LatLng(lot.lat, lot.lng);
    return bounds.contain(position);
  });

  console.log("✅ 현재 지도에 보이는 주차장:", visibleLots);
  renderParkingList(visibleLots);
  updateMarkers(visibleLots);
}

function renderParkingList(parkingLots) {
  let listContainer = document.getElementById("parking-list");
  listContainer.innerHTML = ""; // 기존 리스트 초기화

  parkingLots.forEach((lot) => {
    let listItem = document.createElement("div");
    listItem.className = "list-item";
    listItem.innerText = lot.name + " - " + lot.address;
    listItem.onclick = function () {
      map.setCenter(new kakao.maps.LatLng(lot.lat, lot.lng));
      showToggle(lot);
    };
    listContainer.appendChild(listItem);
  });
}

function updateMarkers(parkingLots) {
  clearMarkers(); // 기존 마커 삭제

  parkingLots.forEach((lot) => {
    let marker = new kakao.maps.Marker({
      map: map,
      position: new kakao.maps.LatLng(lot.lat, lot.lng),
      title: lot.name,
    });

    var infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;">${lot.name}</div>`,
    });

    kakao.maps.event.addListener(marker, "mouseover", function () {
      infowindow.open(map, marker);
    });

    kakao.maps.event.addListener(marker, "mouseout", function () {
      infowindow.close();
    });

    kakao.maps.event.addListener(marker, "click", function () {
      showToggle(lot);
    });

    markers.push(marker);
  });
}

function addMarker(lot) {
  var marker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(lot.lat, lot.lng),
    title: lot.name,
  });

  var infowindow = new kakao.maps.InfoWindow({
    content: `<div style="padding:5px; border-radius:5px; box-shadow:0px 2px 6px rgba(0,0,0,0.2); background:white;">${lot.name}</div>`,
  });

  kakao.maps.event.addListener(marker, "mouseover", function () {
    infowindow.open(map, marker);
  });

  kakao.maps.event.addListener(marker, "mouseout", function () {
    infowindow.close();
  });

  kakao.maps.event.addListener(marker, "click", function () {
    showModal(lot);
  });

  markers.push(marker);
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null)); // 모든 마커 숨기기
  markers = [];
}

function clearParkingList() {
  let listContainer = document.getElementById("parking-list");
  listContainer.innerHTML = ""; // 주차장 리스트 초기화
}

function updateParkingList(data) {
  const listContainer = document.getElementById("parking-list");
  listContainer.innerHTML = "";

  markers.forEach((marker) => marker.setMap(null)); // 기존 마커 숨기기
  markers = [];

  data.forEach((lot) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerText = lot.name;
    item.onclick = function () {
      map.setCenter(new kakao.maps.LatLng(lot.lat, lot.lng));
      showToggle(lot);
    };
    listContainer.appendChild(item);

    addMarker(lot); // 새로운 주차장 마커 표시
  });
}

// 🚀 하단 토글(슬라이드업) 정보 표시
function showToggle(lot) {
  document.getElementById("toggle-title").innerText = lot.name;
  document.getElementById("toggle-address").innerText =
    "주소: " + (lot.address || "정보 없음");
  document.getElementById("toggle-hours").innerText =
    "운영시간: " + (lot.hours || "정보 없음");

  // 🚀 예약 페이지로 이동하는 링크 설정 (현재는 '#' 링크, 나중에 수정 가능)
  if (document.getElementById("detail-button")) {
    document.getElementById("detail-button").href = `/parking-lot/${lot.id}`;
  }

  if (document.getElementById("edit-button")) {
    document.getElementById("edit-button").href =
      "/admin/parkinglot/edit/" + lot.id;
  }

  // 👉 Claude 추천 API 호출
  const recommendationText = document.getElementById("recommendation-result");
  recommendationText.innerText = "로딩 중...";

  fetch(`http://localhost:8005/recommend?lat=${lot.lat}&lng=${lot.lng}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        recommendationText.innerText = "추천 정보를 불러올 수 없습니다.";
      } else {
        const places = data.places;
        recommendationText.innerText =
          `☕️ : ${places["카페"].join(", ")}\n` +
          `🍽️ : ${places["음식점"].join(", ")}\n` +
          `🏛️ : ${places["관광명소"].join(", ")}`;
      }
    })
  .catch((err) => {
    console.error(err);
    recommendationText.innerText = "서버 오류로 불러오지 못했습니다.";
  });

  document.getElementById("toggle-container").style.bottom = "0px"; // 화면 위로 슬라이드업
}

// 🚀 닫기 버튼 클릭 시 다시 숨김
document.getElementById("toggle-close").addEventListener("click", function () {
  document.getElementById("toggle-container").style.bottom = "-250px";
});

// 📌 🔍 장소 검색 후 근처 주차장 찾기 기능 추가
document.getElementById("search-button").addEventListener("click", function () {
  var query = document.getElementById("search-input").value;

  if (query.trim() === "") {
    alert("검색어를 입력하세요.");
    return;
  }

  var ps = new kakao.maps.services.Places();
  ps.keywordSearch(query, function (result, status) {
    if (status === kakao.maps.services.Status.OK) {
      var location = new kakao.maps.LatLng(result[0].y, result[0].x);
      map.setCenter(location);

      // 📌 검색 위치 반경 1km 내 주차장 필터링
      let filteredParking = parkingData.filter((lot) => {
        let distance = getDistance(
          location.getLat(),
          location.getLng(),
          lot.lat,
          lot.lng
        );
        return distance <= 1.0; // 반경 1km 이내
      });

      updateParkingList(filteredParking);
    } else {
      alert("장소를 찾을 수 없습니다.");
    }
  });
});

// 📌 두 좌표 간 거리 계산 (단위: km)
function getDistance(lat1, lng1, lat2, lng2) {
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  var R = 6371; // 지구 반지름 (km)
  var dLat = deg2rad(lat2 - lat1);
  var dLng = deg2rad(lng2 - lng1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 거리 반환 (km)
}

function showModal(lot) {
  console.log("모달 데이터 확인:", lot);
  document.getElementById("modal-title").innerText = lot.name;
  document.getElementById("modal-address").innerText = "주소: " + lot.address;
  document.getElementById("modal-hours").innerText = "운영시간: " + lot.hours;
  document.getElementById("modal").style.display = "block";
  document.getElementById("modal-overlay").style.display = "block";
}

document.getElementById("modal-close").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-overlay").style.display = "none";
});

window.onload = initMap;
