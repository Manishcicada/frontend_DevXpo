import Input from "../components/Input";
import useStore from "../store/useStore";

const Home = () => {

    const avatars = ["/Judge.png", "/Lawyer_bad.png", "/Lawyer_good.png"];

    const avatar = useStore((state) => state.avatar);
    console.log("avatar",avatars[avatar]);

    return (
        <div>
            <div
                className="relative min-h-screen w-full bg-cover bg-center z-50"
                style={{ backgroundImage: `url(${avatars[avatar]})` }}
            ></div>
            <Input></Input>
        </div>
    );
};

export default Home;