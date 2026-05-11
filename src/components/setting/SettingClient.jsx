"use client";

import React from 'react'
import style from '@/app/(pages)/setting/setting.module.scss'
import Link from 'next/link'
import { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";

function Setting() {
    const testAccount = "qwe@email.com"
    const [modify, setModify] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const [account, setAccount] = useState(null);
    const [store, setStore] = useState(null);
    const [storeForm, setStoreForm] = useState({
        name: "",
        address: ""
    });
    const provider = account?.provider || "email";

    useEffect(() => {
        axios.get("/api/setting")
            .then(res => {
                setAccount(res.data.account);
                setStore(res.data.store);

                setStoreForm({
                    name: res.data.store?.name || "",
                    address: res.data.store?.address || ""
                });
            })
            .catch(err => {
                console.error("설정 정보 조회 실패", err);
            });
    }, []);

    const handleSave = () => {
        axios.patch("/api/setting", {
            name: storeForm.name,
            address: storeForm.address
        })
            .then(res => {
                setStore(res.data.store);
                setStoreForm({
                    name: res.data.store.name,
                    address: res.data.store.address
                });
                setModify(false);
            })
            .catch(err => {
                console.error("매장 정보 수정 실패", err);
            });
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm(
            "정말 계정을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다."
        );

        if (!confirmDelete) return;

        /* 테스트 계정 삭제 불가 */
        if (account?.id === testAccount) {
            return alert("테스트 계정은 삭제할 수 없습니다.");
        }

        try {
            await axios.delete("/api/setting");

            await signOut({
                callbackUrl: "/login"
            });

        } catch (error) {
            console.error("계정 삭제 실패", error);
            alert("계정 삭제 중 오류가 발생했습니다.");
        }
    };


    return (
        <section className={style.setting}>
            <div className={style.inner}>
                <h1>설정</h1>

                <div className={style.content}>

                    <section className={style.account}>
                        <h2>내 계정</h2>

                        <div className={style.accountGrid}>
                            <div className={style.profileCard}>
                                <div className={style.profileIcon}>
                                    <p>
                                        <img src="/img/icon/ic-sidebar-profile.png" alt="" />
                                    </p>

                                    <div className={style.profileText}>
                                        <strong>{account?.id}</strong>
                                        {/* <strong>{account?.name || "계정정보없음"}</strong> */}
                                        {/* <p>{account?.id}</p> */}
                                    </div>
                                </div>

                                {/* <button type='button' className={style.moreBtn} onClick={() => setIsOpen(true)}>
                                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.01627 3.95442C8.18635 3.95442 8.34946 3.88686 8.46972 3.7666C8.58998 3.64634 8.65755 3.48323 8.65755 3.31315C8.65755 3.14307 8.58998 2.97996 8.46972 2.8597C8.34946 2.73944 8.18635 2.67188 8.01627 2.67188C7.8462 2.67188 7.68309 2.73944 7.56282 2.8597C7.44256 2.97996 7.375 3.14307 7.375 3.31315C7.375 3.48323 7.44256 3.64634 7.56282 3.7666C7.68309 3.88686 7.8462 3.95442 8.01627 3.95442ZM8.01627 8.6571C8.18635 8.6571 8.34946 8.58953 8.46972 8.46927C8.58998 8.34901 8.65755 8.1859 8.65755 8.01582C8.65755 7.84575 8.58998 7.68264 8.46972 7.56237C8.34946 7.44211 8.18635 7.37455 8.01627 7.37455C7.8462 7.37455 7.68309 7.44211 7.56282 7.56237C7.44256 7.68264 7.375 7.84575 7.375 8.01582C7.375 8.1859 7.44256 8.34901 7.56282 8.46927C7.68309 8.58953 7.8462 8.6571 8.01627 8.6571ZM8.01627 13.3598C8.18635 13.3598 8.34946 13.2922 8.46972 13.1719C8.58998 13.0517 8.65755 12.8886 8.65755 12.7185C8.65755 12.5484 8.58998 12.3853 8.46972 12.265C8.34946 12.1448 8.18635 12.0772 8.01627 12.0772C7.8462 12.0772 7.68309 12.1448 7.56282 12.265C7.44256 12.3853 7.375 12.5484 7.375 12.7185C7.375 12.8886 7.44256 13.0517 7.56282 13.1719C7.68309 13.2922 7.8462 13.3598 8.01627 13.3598Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button> */}
                            </div>

                            <div className={style.loginCard}>
                                <span>로그인 방식</span>

                                <div className={style.loginType}>
                                    <img
                                        src={
                                            provider === "google"
                                                ? "/img/icon/ic-setting-google.png"
                                                : provider === "naver"
                                                    ? "/img/icon/ic-setting-naver.png"
                                                    : "/img/icon/ic_setting-email.png"
                                        }
                                    />
                                    <p>
                                        {
                                        provider === "google"
                                            ? "Google"
                                            : provider === "naver"
                                                ? "Naver"
                                                : "이메일"
                                    }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={style.storeInfo}>
                        <h2>매장 정보</h2>

                        <div className={style.infoList}>
                            {modify ? (
                                <div className={`${style.infoName} ${style.modify}`}>
                                    <input type="text"
                                        value={storeForm.name}
                                        onChange={(e) => setStoreForm({
                                            ...storeForm,
                                            name: e.target.value
                                        })} />
                                </div>
                            ) : (
                                <div className={style.infoName}>
                                    <span>매장 이름</span>
                                    <div>{store?.name}</div>
                                </div>
                            )}

                            {modify ? (
                                <div className={`${style.infoAdd} ${style.modify}`}>
                                    <input type="text"
                                        value={storeForm.address}
                                        onChange={(e) => setStoreForm({
                                            ...storeForm,
                                            address: e.target.value
                                        })} />
                                </div>
                            ) : (
                                <div className={style.infoAdd}>
                                    <span>주소</span>
                                    <div>{store?.address}</div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className={style.actionArea}>
                        {modify && (
                            <button
                                type="button"
                                className={style.cancelBtn}
                                onClick={() => {
                                    setStoreForm({
                                        name: store?.name || "",
                                        address: store?.address || ""
                                    });
                                    setModify(false);
                                }}
                            >
                                취소
                            </button>
                        )}
                        <button
                            type="button"
                            className={style.submitBtn}
                            onClick={modify ? handleSave : () => setModify(true)}
                        >
                            {modify ? "저장" : "수정"}
                        </button>
                    </div>

                    <div className={style.dangerArea}>
                        <button
                            type="button"
                            className={style.logoutBtn}
                            onClick={() => signOut({
                                callbackUrl: "/login"
                            })}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H12V5H5V19H12V21H5ZM16 17L14.625 15.55L17.175 13H9V11H17.175L14.625 8.45L16 7L21 12L16 17Z" fill="currentColor" />
                            </svg>
                            <p>로그아웃</p>
                        </button>

                        <button
                            type="button"
                            className={style.deleteBtn}
                            onClick={handleDeleteAccount}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 5.5H20M9 2.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 8.5H18V20C18 20.3978 17.842 20.7794 17.5607 21.0607C17.2794 21.342 16.8978 21.5 16.5 21.5H7.5C7.10218 21.5 6.72064 21.342 6.43934 21.0607C6.15804 20.7794 6 20.3978 6 20V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            <p>계정 삭제</p>
                        </button>
                    </div>
                </div>
            </div>


            {isOpen && (
                <div className={style.popupWrap}>
                    <form className={style.resetBox}>
                        <h1>비밀번호 재설정하기</h1>
                        <p>새로운 비밀번호를 입력해주세요.</p>

                        <div className={style.pwd}>
                            <div className={style.inputGroup}>
                                <label htmlFor="password">비밀번호</label>
                                <input type="password" id="password" />
                            </div>

                            <div className={style.inputGroup}>
                                <label htmlFor="passwordCheck" className={style.passwordCheck}>비밀번호 재확인</label>
                                <input type="password" id="passwordCheck" />
                            </div>
                        </div>

                        <div className={style.buttonWrap}>
                            <button type="button" className={style.cancelBtn} onClick={() => setIsOpen(false)}>취소</button>
                            <button type="submit" className={style.submitBtn} onClick={() => setIsOpen(false)}>완료</button>
                        </div>
                    </form>
                </div>
            )}
        </section>

    )
}

export default Setting