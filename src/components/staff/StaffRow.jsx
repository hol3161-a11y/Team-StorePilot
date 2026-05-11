import styles from "../../app/(pages)/staff/staff.module.scss";
import { useState, useEffect } from "react";

function StaffRow({ emp, index, onUpdate, onSelect, selected, formatPhone }) {
  // 수정 모드 여부 (true면 input 보여줌)
  const [isEdit, setIsEdit] = useState(false);

  // 수정할 데이터 상태 (폼 역할)
  const [editData, setEditData] = useState(emp);

  // 파트별 색상 지정 함수
  const getPartColor = (part) => {
    if (part === "홀") return "#FFBD07";
    if (part === "주방") return "#F34C4C";
    if (part === "매니저") return "#85D575";
    return "#E8E8E8";
  };

  // emp가 바뀌면 editData도 같이 업데이트
  useEffect(() => {
    if (emp.time) {
      const [startTime, endTime] = emp.time.split("-");

      setEditData({
        ...emp,
        startTime,
        endTime,
      });
    } else {
      setEditData(emp);
    }
  }, [emp]);

  // input 값 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hourlyWage") {
      const onlyNumber = value.replace(/[^0-9]/g, "");

      setEditData((prev) => ({
        ...prev,
        hourlyWage: onlyNumber,
      }));

      return;
    }

    if (name === "days") {
      setEditData((prev) => ({
        ...prev,
        days: value,
      }));

      if (name === "phone") {
        const onlyNumber = value.replace(/[^0-9]/g, "");

        setEditData((prev) => ({
          ...prev,
          phone: onlyNumber,
        }));

        return;
      }

      return;
    }

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 저장 버튼 클릭 시
  const handleSave = () => {
    const formatted = {
      ...editData,
      time: `${editData.startTime}-${editData.endTime}`,
      age: Number(editData.age),
      hourlyWage:
        editData.hourlyWage === "" ? null : Number(editData.hourlyWage),
    };

    onUpdate(index, formatted);
    setIsEdit(false);
  };

  

  return (
    <div className={styles.tableRow}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={selected.includes(index)}
        onChange={() => onSelect(index)}
      />

      {/* 🔹 수정 모드 */}
      {isEdit ? (
        <>
          <span>
            <input
              name="name"
              placeholder="이름"
              value={editData.name}
              onChange={handleChange}
            />
          </span>
          <span>
            <input
              name="age"
              placeholder="나이"
              value={editData.age}
              onChange={handleChange}
            />
          </span>
          <span>
            <input
              name="hourlyWage"
              placeholder="시급"
              value={
                editData.hourlyWage
                  ? Number(editData.hourlyWage).toLocaleString() + "원"
                  : ""
              }
              onChange={handleChange}
            />
          </span>
          <span>
            <input
              name="part"
              placeholder="파트"
              value={editData.part}
              onChange={handleChange}
              style={{ color: getPartColor(emp.part) }}
            />
          </span>
          <span>
            <input
              name="days"
              placeholder="예: 월/화/수"
              value={editData.days}
              onChange={handleChange}
            />
          </span>

          <span>
            <input
              type="time"
              name="startTime"
              className={styles.timeInput}
              value={editData.startTime || ""}
              onChange={handleChange}
            />
            {" - "}
            <input
              type="time"
              name="endTime"
              className={styles.timeInput}
              value={editData.endTime || ""}
              onChange={handleChange}
            />
          </span>

          <span>
            <input
              name="phone"
              placeholder="전화번호"
              value={formatPhone(editData.phone)}
              onChange={handleChange}
            />
          </span>

          <button onClick={handleSave}>저장</button>
        </>
      ) : (
        <>
          {/* 🔹 보기 모드 */}
          <span data-label="이름">{emp.name}</span>

          <span data-label="나이" style={{ color: "#aaa" }}>
            {emp.age}
          </span>

          <span data-label="시급">
            {emp.hourlyWage ? emp.hourlyWage.toLocaleString() + "원" : "-"}
          </span>

          <span data-label="파트" style={{ color: getPartColor(emp.part) }}>
            {emp.part}
          </span>

          <span data-label="근무요일">{emp.days || "-"}</span>

          <span data-label="근무시간">{emp.time || "-"}</span>

          <span data-label="전화번호" style={{ color: "#aaa" }}>
            {emp.phone ? formatPhone(emp.phone) : "-"}
          </span>

          <img
            src="./img/icon/ic-edit.svg"
            alt="수정"
            onClick={() => setIsEdit(true)}
          />
        </>
      )}
    </div>
  );
}

export default StaffRow;
