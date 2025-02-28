import os
import datetime  # datetime 모듈을 명확하게 import
import json
from flask import render_template, send_from_directory, jsonify
from services.common.models import db, ParkingLot  # ORM 모델 임포트
from sqlalchemy.inspection import inspect

# # 📌 주차장 데이터 불러오기 함수 (DB 사용)
# def load_parking_data():
#     BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
#     DB_PATH = os.path.join(BASE_DIR, "common", "parking.db")

#     print("✅ DB 경로: ",DB_PATH)

#     if not os.path.exists(DB_PATH):
#         print(f"❌ 데이터베이스 파일이 존재하지 않습니다! 경로: {DB_PATH}")
#         return []

#     try:
#         # 데이터베이스 연결
#         conn = sqlite3.connect(DB_PATH)
#         cursor = conn.cursor()

#         query = """
#         SELECT 
#             parkinglot_id AS id, 
#             parkinglot_name AS name, 
#             parkinglot_add AS address, 
#             latitude AS lat, 
#             longitude AS lng, 
#             parkinglot_div AS division,
#             parkinglot_type AS type,
#             parkinglot_num AS capacity,
#             parkinglot_cost AS is_paid,
#             parkinglot_day AS available_days,
#             parkinglot_time AS hours
#         FROM parkinglot
#         """
#         df = pd.read_sql_query(query, conn)

#         # pandas 데이터프레임을 JSON으로 변환
#         df = df.fillna("")  # NaN 값이 있으면 빈 문자열로 변환
#         parking_data = df.to_dict(orient="records")

#         conn.close()
#         print("✅ 주차장 데이터 로드 성공!")
#         return parking_data

#     except Exception as e:
#         print(f"❌ DB 데이터 로드 중 오류 발생: {e}")
#         return []

# 📌 ORM 객체를 JSON 형태로 변환하는 함수 (time 필드 변환 추가)
def object_as_dict(obj):
    """SQLAlchemy ORM 객체를 딕셔너리로 변환 (시간 데이터 변환 포함)"""
    data = {}
    for column in inspect(obj).mapper.column_attrs:
        value = getattr(obj, column.key)
        # Time 또는 DateTime 데이터 타입을 문자열로 변환
        if isinstance(value, datetime.time):  
            data[column.key] = value.strftime("%H:%M:%S")  # "HH:MM:SS" 형식으로 변환
        elif isinstance(value, datetime.date):  
            data[column.key] = value.strftime("%Y-%m-%d")  # "YYYY-MM-DD" 형식으로 변환
        elif isinstance(value, datetime.datetime):  
            data[column.key] = value.strftime("%Y-%m-%d %H:%M:%S")  # "YYYY-MM-DD HH:MM:SS" 형식으로 변환
        else:
            data[column.key] = value
    return data

# 📌 홈 페이지 렌더링
def home_view():
    print("✅ home_view호출")
    kakao_api_key = os.getenv("KAKAO_API_KEY")
    return render_template("index.html", kakao_api_key=kakao_api_key)

# 📌 정적 파일 제공
def static_files(filename):
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STATIC_DIR = os.path.join(BASE_DIR, "map_service", "static")
    return send_from_directory(STATIC_DIR, filename)

# 📌 주차장 데이터 불러오기 함수 (ORM 방식)
def load_parking_data():
    print("✅ MySQL에서 주차장 데이터 로드 중...")

    try:
        # ORM을 사용하여 모든 주차장 데이터 조회
        parking_lots = ParkingLot.query.all()
        
        # ORM 객체를 JSON으로 변환
        parking_data = []
        for lot in parking_lots:
            try:
                lat = float(lot.latitude) if lot.latitude else None
                lng = float(lot.longitude) if lot.longitude else None

                # 🚨 유효하지 않은 위도/경도 값 필터링 (위도 0~90, 경도 0~180 범위 확인)
                if lat is None or lng is None or not (0 <= lat <= 90 and 0 <= lng <= 180):
                    print(f"⚠️ 잘못된 좌표 무시됨: {lot.parkinglot_id} - ({lot.latitude}, {lot.longitude})")
                    continue  # 잘못된 데이터는 리스트에 추가하지 않음

            except (ValueError, TypeError):
                print(f"⚠️ 변환 오류로 무시됨: {lot.parkinglot_id} - ({lot.latitude}, {lot.longitude})")
                continue  # 변환 실패 시 무시

            parking_data.append({
                "id": lot.parkinglot_id,
                "name": lot.parkinglot_name,
                "address": lot.parkinglot_add,
                "lat": lat,  # 숫자로 변환된 위도
                "lng": lng,  # 숫자로 변환된 경도
                "division": lot.parkinglot_div,
                "type": lot.parkinglot_type,
                "capacity": lot.parkinglot_num,
                "is_paid": lot.parkinglot_cost,
                "available_days": lot.parkinglot_day,
                "hours": lot.parkinglot_time.strftime("%H:%M:%S") if lot.parkinglot_time else "00:00:00"
            })

        print(f"✅ 정상 데이터 개수: {len(parking_data)}개")
        return parking_data

    except Exception as e:
        print(f"❌ MySQL 데이터 로드 중 오류 발생: {e}")
        return []

# 📌 주차장 데이터 API
def get_parking_lots():
    parking_data = load_parking_data()
    return jsonify(parking_data), 200, {'Content-Type': 'application/json; charset=utf-8'}