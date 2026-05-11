"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import React from "react";
import styles from "../../app/(pages)/staff/staff.module.scss";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import StaffRow from "./StaffRow";

function Staff() {
  const { data: session } = useSession();
  const ownerId =
    session?.user?.email ??
    (typeof window !== "undefined"
      ? localStorage.getItem("storePilot.email")
      : null);

  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const formRef = useRef(null);

  const [keyword, setKeyword] = useState("");

  const [selected, setSelected] = useState([]);

  const [sortType, setSortType] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [form, setForm] = useState({
    name: "",
    age: "",
    hourlyWage: "",
    part: "",
    days: "",
    startTime: "",
    endTime: "",
    phone: "",
  });

  // 직원 가져오기
  async function getEmployee() {
    if (!ownerId) return;
    const res = await axios.get("/api/employee/db", {
      params: {
        ownerId,
        storeId: "001",
      },
    });

    setEmployees(res.data.employees);
  }

  useEffect(() => {
    getEmployee();
  }, [ownerId]);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showForm]);

  // 정렬 아이콘
  const getSortIcon = (type) => {
    if (sortType !== type) return "./img/icon/ic-sort-none.svg";
    return sortOrder === "asc"
      ? "./img/icon/ic-sort-up.svg"
      : "./img/icon/ic-sort-down.svg";
  };

  // 정렬 클릭
  const handleSort = (type) => {
    if (sortType === type) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
  };

  // input
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "hourlyWage") {
      const onlyNumber = value.replace(/[^0-9]/g, "");

      setForm((prev) => ({
        ...prev,
        hourlyWage: onlyNumber,
      }));

      return;
    }
    if (name === "days") {
      setForm((prev) => ({
        ...prev,
        days: value,
      }));

      return;
    }
    if (name === "phone") {
      const onlyNumber = value.replace(/[^0-9]/g, "");

      setForm((prev) => ({
        ...prev,
        phone: onlyNumber,
      }));

      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // POST
  const handleSubmit = async () => {
    const formatted = {
      ownerId: ownerId,

      employees: {
        ...form,

        // 마지막 / 제거
        days: form.days.replace(/\//g, "").split("").join("/"),

        time: `${form.startTime}-${form.endTime}`,

        age: Number(form.age),

        hourlyWage: form.hourlyWage === "" ? null : Number(form.hourlyWage),
      },
    };

    console.log(formatted);

    const res = await axios.post("/api/employee/db", formatted);

    if (res.status == 200) {
      getEmployee();

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);

      setForm({
        name: "",
        age: "",
        hourlyWage: "",
        part: "",
        days: "",
        startTime: "",
        endTime: "",
        phone: "",
      });

      setShowForm(false);
    }
  };

  // PUT
  const handleUpdate = async (_id, updatedData) => {
    const editData = sortedEmployees.map((obj, i) => {
      if (i === _id) {
        obj = updatedData;
      }
      return obj;
    });

    const res = await fetch("/api/employee/db", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, employees: editData, type: "update" }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("수정 실패");
      return;
    }

    setEmployees(editData);
  };

  // 체크
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (isAllChecked) {
      setSelected([]);
    } else {
      const base = keyword ? filteredEmployees : employees;

      setSelected(base.map((emp) => employees.findIndex((e) => e === emp)));
    }
  };

  /* 테스트 계정은 매출 삭제 불가 */
  const [account, setAccount] = useState({});
  const testAccount = 'qwe@email.com';
  useEffect(() => {
    axios.get("/api/setting")
      .then(res => setAccount(res.data.account))
      .catch(err => {
        console.error("계정 정보 조회 실패", err);
      });
  }, []);

  // DELETE
  const handleDeleteSelected = async () => {
    // const deleteData = sortedEmployees.filter((obj, i) => {
    const deleteData = employees.filter((obj, i) => {
      return !selected.includes(i);
    });

    /* 테스트 계정은 매출 삭제 불가 */
    if (account?.id === testAccount) return alert("테스트 계정은 직원 정보를 삭제할 수 없습니다.");

    await fetch("/api/employee/db", {
      method: "put",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, employees: deleteData }),
    });

    setEmployees(deleteData);

    setSelected([]);
    //setIsAllChecked(false);
  };

  // 검색 필터
  const filteredEmployees = employees.filter((emp) => {
    const k = keyword.trim().toLowerCase();

    return (
      emp.part?.toLowerCase().includes(k) || emp.name?.toLowerCase().includes(k)
    );
  });

  const isAllChecked =
    (keyword ? filteredEmployees : employees).length > 0 &&
    (keyword ? filteredEmployees : employees).every((emp) =>
      selected.includes(employees.findIndex((e) => e === emp)),
    );

  // 정렬
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortType) return 0;

    if (sortOrder === "asc") {
      return (a[sortType] ?? 0) > (b[sortType] ?? 0) ? 1 : -1;
    } else {
      return (a[sortType] ?? 0) < (b[sortType] ?? 0) ? 1 : -1;
    }
  });

  const formatPhone = (value = "") => {
    const onlyNumber = value.replace(/[^0-9]/g, "");

    if (onlyNumber.length < 4) return onlyNumber;
    if (onlyNumber.length < 8)
      return onlyNumber.replace(/(\d{3})(\d+)/, "$1-$2");

    return onlyNumber.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
  };

  return (
    <section className={styles.staff}>
      <div className={styles.staffContainer}>
        <div className={styles.staffMain}>
          <div className={styles.staffHeader}>
            <h2>
              <span className={styles.staffTitle}>직원</span> 관리
            </h2>
            <div className={styles.total}>
              <img src="./img/icon/ic_schedul-person.svg" />
              <p>Total : {employees.length}명</p>
            </div>
          </div>

          <div className={styles.staffActions}>
            <Paper className={styles.searchBar}>
              <IconButton sx={{ p: "5px", color: "#aaa" }}>
                <SearchIcon />
              </IconButton>

              <InputBase
                placeholder="이름 또는 파트 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                sx={{ color: "#aaa" }}
              />
            </Paper>

            <div className={styles.staffActionButtons}>
              <img
                src="./img/icon/ic-plus(black).svg"
                onClick={() => setShowForm((prev) => !prev)}
              />
              <img src="./img/icon/ic-bin.svg" onClick={handleDeleteSelected} />
            </div>
          </div>


            <ul className={styles.tableHeader}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={isAllChecked}
                onChange={handleSelectAll}
              />

              <li>
                이름{" "}
                <img
                  src={getSortIcon("name")}
                  onClick={() => handleSort("name")}
                />
              </li>
              <li>
                나이{" "}
                <img
                  src={getSortIcon("age")}
                  onClick={() => handleSort("age")}
                />
              </li>
              <li>
                시급{" "}
                <img
                  src={getSortIcon("hourlyWage")}
                  onClick={() => handleSort("hourlyWage")}
                />
              </li>

              <li>파트</li>
              <li>근무요일</li>
              <li>근무시간</li>
              <li>전화번호</li>
            {/* header */}
            </ul>
          <div className={styles.staffTable}>

            {/* body */}
            <ul className={styles.tableBody}>
              {/* 직원 없을 때 */}
              {employees.length === 0 && !showForm && (
                <li className={styles.empty}>등록된 직원이 없어요</li>
              )}

              {/* 검색했는데 결과 없을 때 */}
              {employees.length > 0 && sortedEmployees.length === 0 && (
                <li className={styles.empty}>검색 결과가 없어요</li>
              )}
              {showForm && (
                <li className={styles.tableRow} ref={formRef}>
                  <input type="checkbox" className={styles.checkbox} />

                  <span>
                    <input
                      placeholder="이름"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      placeholder="나이"
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      placeholder="시급"
                      name="hourlyWage"
                      value={
                        form.hourlyWage
                          ? Number(form.hourlyWage).toLocaleString() + "원"
                          : ""
                      }
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      placeholder="파트"
                      name="part"
                      value={form.part}
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      placeholder="예: 월/화/수"
                      name="days"
                      value={form.days}
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      type="time"
                      name="startTime"
                      className={styles.timeInput}
                      value={form.startTime}
                      onChange={handleChange}
                    />
                    {" - "}
                    <input
                      type="time"
                      name="endTime"
                      className={styles.timeInput}
                      value={form.endTime}
                      onChange={handleChange}
                    />
                  </span>

                  <span>
                    <input
                      placeholder="전화번호"
                      name="phone"
                      value={formatPhone(form.phone)}
                      onChange={handleChange}
                    />
                  </span>

                  <button onClick={handleSubmit}>저장</button>
                </li>
              )}

              {sortedEmployees.map((emp, i) => (
                <StaffRow
                  key={emp._id || i}
                  emp={emp}
                  index={employees.findIndex((e) => e === emp)}
                  // index={i}
                  onUpdate={handleUpdate}
                  onSelect={handleSelect}
                  selected={selected}
                  formatPhone={formatPhone}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Staff;
