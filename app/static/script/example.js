import Logo from "../logo_big.svg";
import Button from "../components/Button";
import styles from "./Main.module.css";

function Main() {
  return (
    <div>
      <div className={styles.top}>
        <img className={styles.logo} src={Logo} />
      </div>
      <div className={styles.bottom}>
        <Button path="login" text="Start" btnType="start" />
      </div>
    </div>
  );
}

export default Main;
